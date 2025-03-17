import { db } from "@db";
import { videos, users } from "@db/schema";
import { and, eq, not, or, sql, between, gte, lte } from "drizzle-orm";

/**
 * Cuenta el número de videos que un youtuber tiene asignados actualmente
 * Sólo considera los videos en estado "upload_media" o "media_corrections"
 * @param userId ID del usuario youtuber
 * @returns Número de videos asignados actualmente
 */
export async function countAssignedVideos(userId: number): Promise<number> {
  try {
    // Obtener todos los videos asignados al usuario en los estados relevantes
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
    
    // Contar manualmente los resultados y loguear para depuración
    console.log(`Videos asignados al usuario ${userId}:`, assignedVideos.length);
    return assignedVideos.length;
  } catch (error) {
    console.error("Error al contar videos asignados:", error);
    return 0;
  }
}

/**
 * Cuenta el número de videos que un youtuber ha realizado en el mes actual
 * @param userId ID del usuario youtuber
 * @returns Número de videos realizados en el mes actual
 */
export async function countMonthlyVideos(userId: number): Promise<number> {
  try {
    // Obtener el primer día del mes actual
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    // Formatear fechas para mostrar en log
    const firstDayStr = firstDayOfMonth.toISOString().split('T')[0];
    const lastDayStr = lastDayOfMonth.toISOString().split('T')[0];
    console.log(`Contando videos del mes (${firstDayStr} al ${lastDayStr}) para usuario ${userId}`);
    
    // Obtener todos los videos completados por el usuario en el mes actual
    // Usamos updatedAt en lugar de completedAt, ya que el campo completedAt no existe
    const monthlyVideos = await db
      .select({ id: videos.id })
      .from(videos)
      .where(
        and(
          eq(videos.contentUploadedBy, userId),
          eq(videos.status, "completed"),
          eq(videos.isDeleted, false),
          // Videos completados en el mes actual (basado en la fecha de última actualización)
          and(
            gte(videos.updatedAt, firstDayOfMonth),
            lte(videos.updatedAt, lastDayOfMonth)
          )
        )
      );
    
    console.log(`Videos del mes para usuario ${userId}:`, monthlyVideos.length);
    return monthlyVideos.length;
  } catch (error) {
    console.error("Error al contar videos mensuales:", error);
    return 0;
  }
}

/**
 * Verifica si un youtuber puede tomar más videos basado en su límite de asignación personal
 * @param userId ID del usuario youtuber
 * @returns { canTakeMore: boolean, currentCount: number, maxAllowed: number }
 */
export async function canYoutuberTakeMoreVideos(userId: number): Promise<{
  canTakeMore: boolean;
  currentCount: number;
  maxAllowed: number;
}> {
  try {
    // Obtener el usuario para verificar su límite
    const [user] = await db
      .select({
        maxVideos: users.maxAssignedVideos
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    if (!user) {
      throw new Error("Usuario no encontrado");
    }
    
    // Obtener el número actual de videos asignados
    const currentCount = await countAssignedVideos(userId);
    const maxAllowed = user.maxVideos || 10; // Usar valor predeterminado 10 si no está definido
    
    return {
      canTakeMore: currentCount < maxAllowed,
      currentCount,
      maxAllowed
    };
  } catch (error) {
    console.error("Error al verificar límite de videos:", error);
    // En caso de error, devolvemos false para evitar asignaciones indebidas
    return {
      canTakeMore: false,
      currentCount: 0,
      maxAllowed: 0
    };
  }
}

/**
 * Verifica si un youtuber ha alcanzado su límite mensual de videos
 * @param userId ID del usuario youtuber
 * @returns { reachedMonthlyLimit: boolean, currentCount: number, monthlyLimit: number }
 */
export async function checkMonthlyVideoLimit(userId: number): Promise<{
  reachedMonthlyLimit: boolean;
  currentMonthCount: number;
  monthlyLimit: number;
}> {
  try {
    // Obtener el usuario para verificar su límite mensual
    const [user] = await db
      .select({
        maxMonthlyVideos: users.maxMonthlyVideos
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    if (!user) {
      throw new Error("Usuario no encontrado");
    }
    
    // Obtener el número de videos completados en el mes actual
    const currentMonthCount = await countMonthlyVideos(userId);
    const monthlyLimit = user.maxMonthlyVideos || 50; // Valor predeterminado si no está definido
    
    return {
      reachedMonthlyLimit: currentMonthCount >= monthlyLimit,
      currentMonthCount,
      monthlyLimit
    };
  } catch (error) {
    console.error("Error al verificar límite mensual:", error);
    // En caso de error, devolvemos que ha alcanzado el límite para evitar asignaciones indebidas
    return {
      reachedMonthlyLimit: true,
      currentMonthCount: 0,
      monthlyLimit: 0
    };
  }
}

/**
 * Obtiene toda la información de límites de videos para un youtuber
 * @param userId ID del usuario youtuber
 * @returns Objeto con toda la información de límites
 */
export async function getYoutuberVideoLimits(userId: number): Promise<{
  currentAssignedCount: number;
  maxAssignedAllowed: number;
  currentMonthCount: number;
  monthlyLimit: number;
  canTakeMoreVideos: boolean;
  reachedMonthlyLimit: boolean;
}> {
  try {
    // Obtener el usuario para verificar sus límites
    const [user] = await db
      .select({
        id: users.id,
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
    
    // Si el usuario no es youtuber, devolvemos valores predeterminados para límites
    // pero mantenemos los valores configurados en la base de datos (para admins que configuran límites)
    const isYoutuber = user.role === 'youtuber';
    
    // Contar videos asignados y mensuales solo si es youtuber
    const currentAssignedCount = isYoutuber ? await countAssignedVideos(userId) : 0;
    const currentMonthCount = isYoutuber ? await countMonthlyVideos(userId) : 0;
    
    // Obtener límites (con valores predeterminados si no están definidos)
    const maxAssignedAllowed = user.maxAssignedVideos || 10; 
    const monthlyLimit = user.maxMonthlyVideos || 50;
    
    return {
      currentAssignedCount,
      maxAssignedAllowed,
      currentMonthCount,
      monthlyLimit,
      canTakeMoreVideos: currentAssignedCount < maxAssignedAllowed,
      reachedMonthlyLimit: currentMonthCount >= monthlyLimit
    };
  } catch (error) {
    console.error("Error al obtener límites de videos:", error);
    // En caso de error, devolvemos valores restrictivos
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