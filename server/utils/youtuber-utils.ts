import { db } from "@db";
import { videos, users } from "@db/schema";
import { and, eq, not, or } from "drizzle-orm";

/**
 * Cuenta el número de videos que un youtuber tiene asignados actualmente
 * Sólo considera los videos en estado "upload_media" o "media_corrections"
 * @param userId ID del usuario youtuber
 * @returns Número de videos asignados actualmente
 */
export async function countAssignedVideos(userId: number): Promise<number> {
  try {
    const result = await db
      .select()
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
      )
      .count();
    
    return parseInt(result[0]?.count as string || "0");
  } catch (error) {
    console.error("Error al contar videos asignados:", error);
    return 0;
  }
}

/**
 * Verifica si un youtuber puede tomar más videos basado en su límite personal
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
    const maxAllowed = user.maxVideos || 3; // Usar valor predeterminado 3 si no está definido
    
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