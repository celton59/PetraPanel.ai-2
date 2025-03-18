import { db } from "db";
import { userSessions, users } from "@db/schema";
import { and, eq, gte, sql } from "drizzle-orm";
import { addDays, startOfDay, endOfDay } from "date-fns";

export async function startUserSession(userId: number, ipAddress: string, userAgent: string) {
  return await db.insert(userSessions).values({
    userId,
    ipAddress,
    userAgent,
    isActive: true
  }).returning();
}

export async function endUserSession(sessionId: number) {
  const session = await db.query.userSessions.findFirst({
    where: eq(userSessions.id, sessionId)
  });

  if (session) {
    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - session.startedAt.getTime()) / 1000);

    await db.update(userSessions)
      .set({
        endedAt: endTime,
        duration,
        isActive: false
      })
      .where(eq(userSessions.id, sessionId));
  }
}

export async function updateLastActivity(sessionId: number) {
  await db.update(userSessions)
    .set({ lastActivityAt: new Date() })
    .where(eq(userSessions.id, sessionId));
}

export async function getUserActivityStats(timeRange: string) {
  const today = new Date();
  let startDate: Date;

  switch (timeRange) {
    case 'today':
      startDate = startOfDay(today);
      break;
    case 'week':
      startDate = addDays(today, -7);
      break;
    case 'month':
      startDate = addDays(today, -30);
      break;
    case 'quarter':
      startDate = addDays(today, -90);
      break;
    default:
      startDate = addDays(today, -7);
  }

  const activeSessions = await db.select({
    count: sql<number>`count(*)`,
  })
  .from(userSessions)
  .where(and(
    eq(userSessions.isActive, true),
    gte(userSessions.startedAt, startDate)
  ));

  const avgDuration = await db.select({
    average: sql<number>`avg(duration)`,
  })
  .from(userSessions)
  .where(gte(userSessions.startedAt, startDate));

  const uniqueUsers = await db.select({
    count: sql<number>`count(distinct ${userSessions.userId})`,
  })
  .from(userSessions)
  .where(gte(userSessions.startedAt, startDate));

  const returningUsers = await db.select({
    count: sql<number>`count(distinct ${userSessions.userId})`,
  })
  .from(userSessions)
  .where(
    and(
      gte(userSessions.startedAt, startDate),
      sql`${userSessions.userId} in (
        select ${userSessions.userId}
        from ${userSessions}
        where ${userSessions.startedAt} < ${startDate}
        group by ${userSessions.userId}
      )`
    )
  );

  return {
    activeSessions: activeSessions[0].count,
    averageSessionDuration: Math.floor(avgDuration[0].average || 0),
    totalUsers: uniqueUsers[0].count,
    returningUsers: returningUsers[0].count,
  };
}

export async function getRecentSessions(timeRange: string) {
  const startDate = timeRange === 'today' 
    ? startOfDay(new Date())
    : addDays(new Date(), timeRange === 'week' ? -7 : -30);

  return await db.query.userSessions.findMany({
    where: gte(userSessions.startedAt, startDate),
    with: {
      user: true
    },
    orderBy: (sessions, { desc }) => [desc(sessions.startedAt)]
  });
}
