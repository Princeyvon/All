import { and, eq } from "drizzle-orm";
import { dailyRewindSettings } from "../drizzle/schema";
import { getDb } from "./db";

const inMemoryDailyRewind = new Map<number, any>();

export async function getDailyRewindSettings(userId: number) {
  const db = await getDb();
  if (!db) return inMemoryDailyRewind.get(userId);
  const rows = await db.select().from(dailyRewindSettings).where(eq(dailyRewindSettings.userId, userId)).limit(1);
  return rows[0];
}

export async function getDailyRewindByTaskUid(taskUid: string) {
  const db = await getDb();
  if (!db) {
    for (const settings of Array.from(inMemoryDailyRewind.values())) {
      if (settings.scheduleCronTaskUid === taskUid) return settings;
    }
    return undefined;
  }
  const rows = await db.select().from(dailyRewindSettings).where(eq(dailyRewindSettings.scheduleCronTaskUid, taskUid)).limit(1);
  return rows[0];
}

export async function saveDailyRewindSettings(userId: number, values: Partial<typeof dailyRewindSettings.$inferInsert>) {
  const db = await getDb();
  if (!db) {
    const existing = inMemoryDailyRewind.get(userId) || { id: 1, userId, createdAt: new Date(), updatedAt: new Date() };
    const updated = { ...existing, ...values, updatedAt: new Date() };
    inMemoryDailyRewind.set(userId, updated);
    return updated;
  }
  const existing = await getDailyRewindSettings(userId);
  if (existing) {
    await db.update(dailyRewindSettings).set(values).where(and(eq(dailyRewindSettings.id, existing.id), eq(dailyRewindSettings.userId, userId)));
    return { ...existing, ...values };
  }
  await db.insert(dailyRewindSettings).values({ userId, ...values });
  return getDailyRewindSettings(userId);
}
