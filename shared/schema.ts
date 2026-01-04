import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, decimal, json, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("customer"), // admin, customer
  isActive: integer("is_active").notNull().default(1), // 1 = active, 0 = disabled
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  emailIdx: index("user_email_idx").on(table.email),
  roleIdx: index("user_role_idx").on(table.role),
}));

export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email("Invalid email address"),
  passwordHash: z.string().min(60), // bcrypt hash length
  role: z.enum(["admin", "customer"]),
}).pick({
  email: true,
  passwordHash: true,
  role: true,
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// Safe user type (excludes password hash)
export type User = Omit<typeof users.$inferSelect, 'passwordHash'>;
export type UserWithPassword = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginCredentials = z.infer<typeof loginSchema>;

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  stripeSessionId: text("stripe_session_id").notNull().unique(),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  printfulOrderId: text("printful_order_id"),
  status: text("status").notNull().default("pending"), // pending, processing, shipped, completed, failed, refunded, returned, cancelled
  customerEmail: text("customer_email").notNull(),
  customerName: text("customer_name"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("usd"),
  shippingAddress: json("shipping_address").$type<{
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  }>(),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  stripeSessionIdx: index("stripe_session_idx").on(table.stripeSessionId),
  statusIdx: index("status_idx").on(table.status),
  customerEmailIdx: index("customer_email_idx").on(table.customerEmail),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
}));

export const orderItems = pgTable("order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  printfulProductId: text("printful_product_id").notNull(),
  printfulVariantId: text("printful_variant_id").notNull(),
  name: text("name").notNull(),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  orderIdIdx: index("order_id_idx").on(table.orderId),
}));

export const orderEvents = pgTable("order_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(), // payment_success, payment_failed, printful_created, printful_failed, shipped, returned, cancelled, failed, notification_sent
  status: text("status").notNull(), // success, failed
  message: text("message"),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  orderIdIdx: index("order_event_order_id_idx").on(table.orderId),
  eventTypeIdx: index("event_type_idx").on(table.eventType),
  createdAtIdx: index("order_event_created_at_idx").on(table.createdAt),
}));

export const insertOrderSchema = createInsertSchema(orders);
export const insertOrderItemSchema = createInsertSchema(orderItems);
export const insertOrderEventSchema = createInsertSchema(orderEvents);

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderEvent = typeof orderEvents.$inferSelect;
export type InsertOrderEvent = z.infer<typeof insertOrderEventSchema>;

// Audit Log Table - Comprehensive audit trail for compliance (GDPR, SOC2, etc.)
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Actor information
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  userEmail: text("user_email"), // Denormalized for audit trail even if user deleted
  userRole: text("user_role"), // admin, customer, system
  
  // Action details
  action: text("action").notNull(), // login, logout, create_order, update_order, delete_user, export_data, etc.
  resource: text("resource").notNull(), // user, order, order_item, admin_settings, etc.
  resourceId: text("resource_id"), // ID of affected resource
  
  // Event classification
  category: text("category").notNull(), // authentication, authorization, data_access, data_modification, security, compliance
  severity: text("severity").notNull().default("info"), // info, warning, critical
  
  // Request context
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  requestMethod: text("request_method"), // GET, POST, PUT, DELETE
  requestPath: text("request_path"),
  
  // Outcome
  status: text("status").notNull(), // success, failure, denied
  statusCode: integer("status_code"), // HTTP status code
  errorMessage: text("error_message"),
  
  // Data changes (sanitized)
  changesBefore: json("changes_before").$type<Record<string, unknown>>(), // Previous state (PII masked)
  changesAfter: json("changes_after").$type<Record<string, unknown>>(), // New state (PII masked)
  
  // Compliance markers
  gdprRelevant: integer("gdpr_relevant").notNull().default(0), // 1 if GDPR relevant action
  retentionPolicy: text("retention_policy").default("standard"), // standard, extended, permanent
  
  // Additional context
  metadata: json("metadata").$type<Record<string, unknown>>(),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("audit_user_id_idx").on(table.userId),
  actionIdx: index("audit_action_idx").on(table.action),
  categoryIdx: index("audit_category_idx").on(table.category),
  severityIdx: index("audit_severity_idx").on(table.severity),
  resourceIdx: index("audit_resource_idx").on(table.resource, table.resourceId),
  createdAtIdx: index("audit_created_at_idx").on(table.createdAt),
  gdprIdx: index("audit_gdpr_idx").on(table.gdprRelevant),
}));

export const insertAuditLogSchema = createInsertSchema(auditLogs);
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
