import type { Request } from "express";

import { auditLogs, type InsertAuditLog, type AuditLog } from "../shared/schema";

import { db } from "./db";
import { sanitizeObject } from "./log-sanitizer";
import { logger } from "./logger";


// Audit action types
export const AuditAction = {
  // Authentication
  LOGIN: "login",
  LOGOUT: "logout",
  LOGIN_FAILED: "login_failed",
  SESSION_EXPIRED: "session_expired",
  PASSWORD_RESET: "password_reset",
  
  // User management
  USER_CREATE: "user_create",
  USER_UPDATE: "user_update",
  USER_DELETE: "user_delete",
  USER_ACTIVATE: "user_activate",
  USER_DEACTIVATE: "user_deactivate",
  
  // Order management
  ORDER_CREATE: "order_create",
  ORDER_UPDATE: "order_update",
  ORDER_VIEW: "order_view",
  ORDER_CANCEL: "order_cancel",
  ORDER_REFUND: "order_refund",
  
  // Data access (GDPR relevant)
  DATA_EXPORT: "data_export",
  DATA_DELETE: "data_delete",
  PII_ACCESS: "pii_access",
  
  // Admin actions
  ADMIN_SETTINGS_UPDATE: "admin_settings_update",
  ADMIN_DASHBOARD_ACCESS: "admin_dashboard_access",
  
  // Security events
  SECURITY_RATE_LIMIT: "security_rate_limit",
  SECURITY_INVALID_TOKEN: "security_invalid_token",
  SECURITY_PERMISSION_DENIED: "security_permission_denied",
} as const;

export const AuditCategory = {
  AUTHENTICATION: "authentication",
  AUTHORIZATION: "authorization",
  DATA_ACCESS: "data_access",
  DATA_MODIFICATION: "data_modification",
  SECURITY: "security",
  COMPLIANCE: "compliance",
} as const;

export const AuditSeverity = {
  INFO: "info",
  WARNING: "warning",
  CRITICAL: "critical",
} as const;

export interface AuditContext {
  userId?: string;
  userEmail?: string;
  userRole?: string;
  action: string;
  resource: string;
  resourceId?: string;
  category: string;
  severity?: string;
  status: "success" | "failure" | "denied";
  statusCode?: number;
  errorMessage?: string;
  changesBefore?: Record<string, unknown>;
  changesAfter?: Record<string, unknown>;
  gdprRelevant?: boolean;
  metadata?: Record<string, unknown>;
  req?: Request;
}

export class AuditService {
  /**
   * Log an audit event with automatic PII masking
   */
  static async log(context: AuditContext): Promise<void> {
    try {
      const ipAddress = context.req?.ip || context.req?.connection?.remoteAddress;
      const userAgent = context.req?.get("user-agent");
      
      // Mask PII in before/after changes
      const changesBefore = context.changesBefore 
        ? this.maskSensitiveData(context.changesBefore) 
        : null;
      const changesAfter = context.changesAfter 
        ? this.maskSensitiveData(context.changesAfter) 
        : null;

      const auditEntry: InsertAuditLog = {
        userId: context.userId,
        userEmail: context.userEmail,
        userRole: context.userRole || "system",
        action: context.action,
        resource: context.resource,
        resourceId: context.resourceId,
        category: context.category,
        severity: context.severity || AuditSeverity.INFO,
        ipAddress,
        userAgent,
        requestMethod: context.req?.method,
        requestPath: context.req?.path,
        status: context.status,
        statusCode: context.statusCode,
        errorMessage: context.errorMessage,
        changesBefore,
        changesAfter,
        gdprRelevant: context.gdprRelevant ? 1 : 0,
        metadata: context.metadata,
      };

      // Debug: log what we're trying to insert
      logger.debug({ auditEntry: this.maskSensitiveData(auditEntry as Record<string, unknown>) }, "Inserting audit log");
      
      await db.insert(auditLogs).values(auditEntry);

      // Also log to application logger for real-time monitoring
      const logLevel = context.severity === AuditSeverity.CRITICAL ? "error" :
                      context.severity === AuditSeverity.WARNING ? "warn" : "info";
      
      const logData = {
        audit: true,
        action: context.action,
        resource: context.resource,
        status: context.status,
        userId: context.userId,
        ipAddress,
      };
      const logMessage = `[AUDIT] ${context.action} on ${context.resource}`;
      
      if (logLevel === "error") {
        logger.error(logData, logMessage);
      } else if (logLevel === "warn") {
        logger.warn(logData, logMessage);
      } else {
        logger.info(logData, logMessage);
      }

    } catch (error) {
      // Critical: audit logging failure should be logged but not throw
      logger.error({ 
        error, 
        context: this.maskSensitiveData(context as Record<string, unknown>) 
      }, "Failed to write audit log");
    }
  }

  /**
   * Log authentication event
   */
  static async logAuth(
    action: string,
    status: "success" | "failure",
    req: Request,
    userEmail?: string,
    userId?: string,
    errorMessage?: string
  ): Promise<void> {
    await this.log({
      userId,
      userEmail,
      action,
      resource: "authentication",
      category: AuditCategory.AUTHENTICATION,
      severity: status === "failure" ? AuditSeverity.WARNING : AuditSeverity.INFO,
      status,
      errorMessage,
      req,
    });
  }

  /**
   * Log data access (GDPR relevant)
   */
  static async logDataAccess(
    resource: string,
    resourceId: string,
    userId: string,
    userEmail: string,
    req: Request
  ): Promise<void> {
    await this.log({
      userId,
      userEmail,
      action: AuditAction.PII_ACCESS,
      resource,
      resourceId,
      category: AuditCategory.DATA_ACCESS,
      severity: AuditSeverity.INFO,
      status: "success",
      gdprRelevant: true,
      req,
    });
  }

  /**
   * Log data modification
   */
  static async logDataChange(
    action: string,
    resource: string,
    resourceId: string,
    userId: string,
    userEmail: string,
    userRole: string,
    before: Record<string, unknown>,
    after: Record<string, unknown>,
    req: Request
  ): Promise<void> {
    await this.log({
      userId,
      userEmail,
      userRole,
      action,
      resource,
      resourceId,
      category: AuditCategory.DATA_MODIFICATION,
      severity: AuditSeverity.INFO,
      status: "success",
      changesBefore: before,
      changesAfter: after,
      gdprRelevant: this.isGDPRRelevant(resource),
      req,
    });
  }

  /**
   * Log security event
   */
  static async logSecurity(
    action: string,
    status: "success" | "failure" | "denied",
    req: Request,
    errorMessage?: string,
    userId?: string
  ): Promise<void> {
    await this.log({
      userId,
      action,
      resource: "security",
      category: AuditCategory.SECURITY,
      severity: AuditSeverity.WARNING,
      status,
      errorMessage,
      req,
    });
  }

  /**
   * Mask sensitive data in audit logs
   */
  private static maskSensitiveData(data: Record<string, unknown>): Record<string, unknown> {
    // Use the centralized sanitizeObject function
    return sanitizeObject(data);
  }

  /**
   * Determine if resource is GDPR relevant
   */
  private static isGDPRRelevant(resource: string): boolean {
    const gdprResources = ["user", "order", "customer", "profile"];
    return gdprResources.some(r => resource.toLowerCase().includes(r));
  }

  /**
   * Query audit logs (for admin dashboard)
   */
  static queryLogs(filters: {
    userId?: string;
    action?: string;
    category?: string;
    severity?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) {
    // Implementation for admin to query audit logs
    const query = db.select().from(auditLogs);
    
    // Add filters...
    // This would be expanded based on requirements
    
    return query.limit(filters.limit || 100);
  }

  /**
   * Export user data for GDPR compliance
   */
  static async exportUserAuditTrail(userId: string): Promise<AuditLog[]> {
    const { eq } = await import("drizzle-orm");
    return db.select()
      .from(auditLogs)
      .where(eq(auditLogs.userId, userId));
  }

  /**
   * Delete user audit data (GDPR right to be forgotten)
   * Note: Some audit logs may need to be retained for legal reasons
   */
  static async anonymizeUserAuditTrail(userId: string): Promise<void> {
    const { eq } = await import("drizzle-orm");
    
    // Anonymize rather than delete to maintain audit trail integrity
    await db.update(auditLogs)
      .set({
        userEmail: "***ANONYMIZED***",
        ipAddress: "0.0.0.0",
        userAgent: "***ANONYMIZED***",
      })
      .where(eq(auditLogs.userId, userId));
  }
}

// Export types
export type { AuditLog };
