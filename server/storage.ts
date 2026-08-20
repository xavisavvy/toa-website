import { randomUUID } from "crypto";

import { type User, type InsertUser } from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;

  constructor() {
    this.users = new Map();
  }

  // eslint-disable-next-line require-await -- must stay async to satisfy the IStorage interface (callers `await` it; a future DB-backed implementation will need the await)
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  // eslint-disable-next-line require-await -- must stay async to satisfy the IStorage interface (callers `await` it; a future DB-backed implementation will need the await)
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  // eslint-disable-next-line require-await -- must stay async to satisfy the IStorage interface (callers `await` it; a future DB-backed implementation will need the await)
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      isActive: 1,
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(id, user);
    return user;
  }
}

export const storage = new MemStorage();
