import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, dashboardSnapshots } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

const inMemoryUsers = new Map<string, any>();
const inMemorySnapshots = new Map<number, { id: number; userId: number; snapshot: string; createdAt: Date; updatedAt: Date }>();

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    const existing = inMemoryUsers.get(user.openId) || {
      id: 1,
      openId: user.openId,
      name: user.name || "Personal Life Dashboard",
      email: user.email || null,
      loginMethod: user.loginMethod || "pin",
      role: user.role || "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };
    if (user.name) existing.name = user.name;
    if (user.email) existing.email = user.email;
    if (user.role) existing.role = user.role;
    existing.lastSignedIn = user.lastSignedIn || new Date();
    existing.updatedAt = new Date();
    inMemoryUsers.set(user.openId, existing);
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getPrimaryUser() {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).orderBy(users.id).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    return inMemoryUsers.get(openId);
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getDashboardSnapshot(userId: number) {
  const db = await getDb();
  if (!db) {
    return inMemorySnapshots.get(userId);
  }
  const result = await db.select().from(dashboardSnapshots).where(eq(dashboardSnapshots.userId, userId)).limit(1);
  return result[0];
}

export async function saveDashboardSnapshot(userId: number, snapshot: string) {
  const db = await getDb();
  if (!db) {
    const existing = inMemorySnapshots.get(userId);
    if (existing) {
      existing.snapshot = snapshot;
      existing.updatedAt = new Date();
    } else {
      inMemorySnapshots.set(userId, {
        id: 1,
        userId,
        snapshot,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    return;
  }
  const existing = await getDashboardSnapshot(userId);
  if (existing) {
    await db.update(dashboardSnapshots).set({ snapshot, updatedAt: new Date() }).where(eq(dashboardSnapshots.userId, userId));
  } else {
    await db.insert(dashboardSnapshots).values({ userId, snapshot });
  }
}
