import { db } from "@db";
import { videos, users, monthlyVideoLimits, monthlyLimitChanges } from "@db/schema";
import { and, eq, not, or, sql, between, gte, lte, isNull, isNotNull, desc } from "drizzle-orm";

/**
 * Verifica si un youtuber puede tomar más videos basado en sus límites
 */
export async function canYoutuberTakeMoreVideos(userId: number): Promise<{
  canTakeMore: boolean;
  currentCount: number;
  maxAllowed: number;
  monthlyLimitReached: boolean;
}> {
  try {
    const limits = await getYoutuberVideoLimits(userId);

    return {
      canTakeMore: limits.canTakeMoreVideos && !limits.reachedMonthlyLimit,
      currentCount: limits.currentAssignedCount,
      maxAllowed: limits.maxAssignedAllowed,
      monthlyLimitReached: limits.reachedMonthlyLimit
    };
  } catch (error) {
    console.error("Error al verificar si el youtuber puede tomar más videos:", error);
    return {
      canTakeMore: false,
      currentCount: 0,
      maxAllowed: 0,
      monthlyLimitReached: true
    };
  }
}

/**
 * Cuenta el número de videos que un youtuber tiene asignados actualmente
 */
export async function countAssignedVideos(userId: number): Promise<number> {
  try {
    const assignedVideos = await db
      .select({ id: videos.id })
      .from(videos)
      .where(
        and(
          eq(videos.contentUploadedBy, userId),
          or(
            eq(videos.status, "upload_media"),
            eq(videos.status, "media_corrections")
          ),
          eq(videos.isDeleted, false)
        )
      );

    return assignedVideos.length;
  } catch (error) {
    console.error("Error al contar videos asignados:", error);
    return 0;
  }
}

/**
 * Cuenta el número de videos completados por un youtuber en un mes específico
 */
export async function countMonthlyVideos(
  userId: number,
  year: number = new Date().getFullYear(),
  month: number = new Date().getMonth() + 1
): Promise<number> {
  try {
    const firstDayOfMonth = new Date(year, month - 1, 1);
    const lastDayOfMonth = new Date(year, month, 0);

    const monthlyVideos = await db
      .select({ id: videos.id })
      .from(videos)
      .where(
        and(
          eq(videos.contentUploadedBy, userId),
          eq(videos.status, "completed"),
          eq(videos.isDeleted, false),
          or(
            and(
              isNotNull(videos.completedAt),
              between(videos.completedAt, firstDayOfMonth, lastDayOfMonth)
            ),
            and(
              isNull(videos.completedAt),
              between(videos.updatedAt, firstDayOfMonth, lastDayOfMonth)
            )
          )
        )
      );

    return monthlyVideos.length;
  } catch (error) {
    console.error("Error al contar videos mensuales:", error);
    return 0;
  }
}

/**
 * Calcula el límite prorrateado para un mes parcial
 */
function calculateProratedLimit(
  fullMonthLimit: number,
  startDate: Date,
  endDate: Date
): number {
  const monthDays = new Date(
    endDate.getFullYear(),
    endDate.getMonth() + 1,
    0
  ).getDate();
  const activeDays = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  return Math.ceil((fullMonthLimit * activeDays) / monthDays);
}

/**
 * Establece un límite mensual específico para un usuario
 */
export async function setMonthlyLimit(
  userId: number,
  maxVideos: number,
  year: number = new Date().getFullYear(),
  month: number = new Date().getMonth() + 1,
  createdBy: number,
  options: {
    isProrated?: boolean;
    overrideReason?: string;
    startDate?: Date;
  } = {}
): Promise<boolean> {
  try {
    const { isProrated, overrideReason, startDate } = options;

    let finalLimit = maxVideos;
    if (isProrated && startDate) {
      const endDate = new Date(year, month, 0);
      finalLimit = calculateProratedLimit(maxVideos, startDate, endDate);
    }

    const [existingLimit] = await db
      .select({
        id: monthlyVideoLimits.id,
        currentLimit: monthlyVideoLimits.maxVideos
      })
      .from(monthlyVideoLimits)
      .where(
        and(
          eq(monthlyVideoLimits.userId, userId),
          eq(monthlyVideoLimits.year, year),
          eq(monthlyVideoLimits.month, month)
        )
      )
      .limit(1);

    if (existingLimit) {
      await db.insert(monthlyLimitChanges).values({
        limitId: existingLimit.id,
        previousLimit: existingLimit.currentLimit,
        newLimit: finalLimit,
        reason: overrideReason || null,
        changedBy: createdBy,
        changedAt: new Date()
      });

      await db
        .update(monthlyVideoLimits)
        .set({
          maxVideos: finalLimit,
          isProrated: isProrated || false,
          overrideReason,
          updatedAt: new Date()
        })
        .where(eq(monthlyVideoLimits.id, existingLimit.id));
    } else {
      await db
        .insert(monthlyVideoLimits)
        .values({
          userId,
          year,
          month,
          maxVideos: finalLimit,
          isProrated: isProrated || false,
          overrideReason,
          createdBy,
          createdAt: new Date(),
          updatedAt: new Date()
        });
    }

    return true;
  } catch (error) {
    console.error("Error al establecer límite mensual específico:", error);
    return false;
  }
}

/**
 * Obtiene el límite mensual específico para un usuario y un mes/año concreto
 */
export async function getMonthlyLimit(
  userId: number,
  year: number = new Date().getFullYear(),
  month: number = new Date().getMonth() + 1
): Promise<number | null> {
  try {
    const [specificLimit] = await db
      .select({
        maxVideos: monthlyVideoLimits.maxVideos,
        isProrated: monthlyVideoLimits.isProrated,
        overrideReason: monthlyVideoLimits.overrideReason
      })
      .from(monthlyVideoLimits)
      .where(
        and(
          eq(monthlyVideoLimits.userId, userId),
          eq(monthlyVideoLimits.year, year),
          eq(monthlyVideoLimits.month, month)
        )
      )
      .limit(1);

    return specificLimit ? specificLimit.maxVideos : null;
  } catch (error) {
    console.error("Error al obtener límite mensual específico:", error);
    return null;
  }
}

/**
 * Obtiene todos los límites mensuales específicos de un usuario
 */
export async function getAllMonthlyLimits(userId: number): Promise<Array<{
  year: number;
  month: number;
  maxVideos: number;
  isProrated: boolean;
  overrideReason?: string;
}>> {
  try {
    const limits = await db
      .select({
        year: monthlyVideoLimits.year,
        month: monthlyVideoLimits.month,
        maxVideos: monthlyVideoLimits.maxVideos,
        isProrated: monthlyVideoLimits.isProrated,
        overrideReason: monthlyVideoLimits.overrideReason
      })
      .from(monthlyVideoLimits)
      .where(eq(monthlyVideoLimits.userId, userId))
      .orderBy(monthlyVideoLimits.year, monthlyVideoLimits.month);

    return limits;
  } catch (error) {
    console.error("Error al obtener límites mensuales:", error);
    return [];
  }
}

/**
 * Obtiene información detallada sobre los límites de videos de un youtuber
 */
export async function getYoutuberVideoLimits(userId: number): Promise<{
  currentAssignedCount: number;
  maxAssignedAllowed: number;
  currentMonthCount: number;
  monthlyLimit: number;
  canTakeMoreVideos: boolean;
  reachedMonthlyLimit: boolean;
  specificMonthlyLimit?: boolean;
  monthlyLimits?: Array<{
    year: number;
    month: number;
    maxVideos: number;
    isProrated: boolean;
    overrideReason?: string;
  }>;
  limitHistory?: Array<{
    date: Date;
    previousLimit: number;
    newLimit: number;
    reason?: string;
  }>;
}> {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const [user] = await db
      .select({
        role: users.role,
        maxAssignedVideos: users.maxAssignedVideos,
        maxMonthlyVideos: users.maxMonthlyVideos
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    const isYoutuber = user.role === 'youtuber';
    const currentAssignedCount = isYoutuber ? await countAssignedVideos(userId) : 0;
    const currentMonthCount = isYoutuber ? await countMonthlyVideos(userId, currentYear, currentMonth) : 0;

    const [specificLimit] = await db
      .select()
      .from(monthlyVideoLimits)
      .where(
        and(
          eq(monthlyVideoLimits.userId, userId),
          eq(monthlyVideoLimits.year, currentYear),
          eq(monthlyVideoLimits.month, currentMonth)
        )
      )
      .limit(1);

    let limitHistory = [];
    if (specificLimit) {
      limitHistory = await db
        .select({
          date: monthlyLimitChanges.changedAt,
          previousLimit: monthlyLimitChanges.previousLimit,
          newLimit: monthlyLimitChanges.newLimit,
          reason: monthlyLimitChanges.reason
        })
        .from(monthlyLimitChanges)
        .where(eq(monthlyLimitChanges.limitId, specificLimit.id))
        .orderBy(desc(monthlyLimitChanges.changedAt));
    }

    const allMonthlyLimits = await getAllMonthlyLimits(userId);
    const maxAssignedAllowed = user.maxAssignedVideos || 10;
    const monthlyLimit = specificLimit?.maxVideos || user.maxMonthlyVideos || 50;

    return {
      currentAssignedCount,
      maxAssignedAllowed,
      currentMonthCount,
      monthlyLimit,
      canTakeMoreVideos: currentAssignedCount < maxAssignedAllowed,
      reachedMonthlyLimit: currentMonthCount >= monthlyLimit,
      specificMonthlyLimit: !!specificLimit,
      monthlyLimits: allMonthlyLimits,
      limitHistory
    };
  } catch (error) {
    console.error("Error al obtener límites de videos:", error);
    return {
      currentAssignedCount: 0,
      maxAssignedAllowed: 0,
      currentMonthCount: 0,
      monthlyLimit: 0,
      canTakeMoreVideos: false,
      reachedMonthlyLimit: true
    };
  }
}