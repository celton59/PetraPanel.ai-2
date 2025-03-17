import { db } from "@db";
import { videos, users, monthlyVideoLimits, monthlyLimitChanges } from "@db/schema";
import { and, eq, not, or, sql, between, gte, lte, isNull, isNotNull, desc } from "drizzle-orm";

/**
 * Cuenta el número de videos que un youtuber tiene asignados actualmente
 * @param userId ID del usuario youtuber
 * @returns Número de videos asignados actualmente
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
 * @param userId ID del usuario youtuber
 * @param year Año a consultar
 * @param month Mes a consultar (1-12)
 * @returns Número de videos completados en el mes
 */
export async function countMonthlyVideos(
  userId: number,
  year: number = new Date().getFullYear(),
  month: number = new Date().getMonth() + 1
): Promise<number> {
  try {
    const firstDayOfMonth = new Date(year, month - 1, 1);
    const lastDayOfMonth = new Date(year, month, 0);

    // Usar completedAt para el conteo si está disponible, si no usar updatedAt
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
 * @param fullMonthLimit Límite para un mes completo
 * @param startDate Fecha de inicio del período
 * @param endDate Fecha de fin del período
 * @returns Límite prorrateado
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
 * @param userId ID del usuario youtuber
 * @param maxVideos Número máximo de videos permitidos
 * @param year Año
 * @param month Mes (1-12)
 * @param createdBy ID del usuario que establece el límite
 * @param options Opciones adicionales (prorrateo, razón del cambio)
 * @returns true si se estableció correctamente
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

    // Calcular límite prorrateado si es necesario
    let finalLimit = maxVideos;
    if (isProrated && startDate) {
      const endDate = new Date(year, month, 0);
      finalLimit = calculateProratedLimit(maxVideos, startDate, endDate);
    }

    // Verificar si ya existe un límite
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
      // Registrar el cambio en el histórico
      await db.insert(monthlyLimitChanges).values({
        limitId: existingLimit.id,
        previousLimit: existingLimit.currentLimit,
        newLimit: finalLimit,
        reason: overrideReason || null,
        changedBy: createdBy,
        changedAt: new Date()
      });

      // Actualizar el límite existente
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
      // Crear nuevo límite
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
 * @param userId ID del usuario youtuber
 * @param year Año (por defecto año actual)
 * @param month Mes (1-12) (por defecto mes actual)
 * @returns Límite mensual específico o null si no existe
 */
export async function getMonthlyLimit(
  userId: number,
  year: number = new Date().getFullYear(),
  month: number = new Date().getMonth() + 1
): Promise<number | null> {
  try {
    // Buscar si existe un límite específico para ese mes y usuario
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

    // Si existe un límite específico, lo devolvemos
    if (specificLimit) {
      return specificLimit.maxVideos;
    }

    // Si no existe límite específico, devolvemos null
    return null;
  } catch (error) {
    console.error("Error al obtener límite mensual específico:", error);
    return null;
  }
}

/**
 * Obtiene todos los límites mensuales específicos de un usuario
 * @param userId ID del usuario youtuber
 * @returns Array de límites mensuales específicos
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

    // Obtener usuario y sus límites
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

    // Obtener conteos solo si es youtuber
    const currentAssignedCount = isYoutuber ? await countAssignedVideos(userId) : 0;
    const currentMonthCount = isYoutuber ? await countMonthlyVideos(userId, currentYear, currentMonth) : 0;

    // Obtener límite específico para el mes actual
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

    // Obtener histórico de cambios si existe un límite específico
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

    // Obtener todos los límites mensuales
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