import { User, VideoStatus } from "@db/schema";

/**
 * Estados visibles según el rol del usuario
 * Basado en los estados definidos en el esquema: 
 * 'available', 'content_corrections', 'content_review', 'upload_media', 
 * 'media_corrections', 'media_review', 'final_review', 'completed'
 */
export const VISIBLE_STATES: Record<User["role"], readonly string[]> = {
  optimizer: [
    "available",
    "content_corrections",
    "completed",
  ],
  youtuber: [
    "upload_media", 
    "media_corrections", 
    "final_review", 
    "completed"
  ],
  reviewer: [
    "content_review",
    "media_review",
    "final_review",
    "completed",
  ],
  content_reviewer: ["content_review"],
  media_reviewer: ["media_review"],
  admin: [
    "available",
    "content_corrections",
    "content_review",
    "upload_media",
    "media_corrections",
    "media_review",
    "final_review",
    "completed",
  ],
} as const;

/**
 * Permisos para ver detalles de videos según el rol
 */
export const DETAILS_PERMISSION: Record<User["role"], VideoStatus[]> = {
  admin: [],  // Admin puede ver todos, se gestiona en la lógica
  optimizer: ["available", "content_corrections"],
  reviewer: ["content_review", "media_review"],
  content_reviewer: ['content_review'],
  media_reviewer: ['media_review'],
  youtuber: ["upload_media", "media_corrections"],
};

/**
 * Verifica si un usuario puede ver un video basado en su rol y el estado del video
 * @param userRole Rol del usuario
 * @param videoStatus Estado del video
 * @returns True si el usuario puede ver el video, false en caso contrario
 */
export function canUserSeeVideo(userRole: User["role"], videoStatus: string): boolean {
  // Admin puede ver todos los videos
  if (userRole === "admin") return true;
  
  // Para otros roles, verificar si el estado está en su lista de estados visibles
  return VISIBLE_STATES[userRole].includes(videoStatus as any);
}

/**
 * Verifica si un usuario puede ver los detalles de un video basado en su rol y el estado del video
 * @param userRole Rol del usuario
 * @param videoStatus Estado del video
 * @returns True si el usuario puede ver los detalles del video, false en caso contrario
 */
export function canUserSeeVideoDetails(userRole: User["role"], videoStatus: string): boolean {
  // Admin puede ver detalles de todos los videos
  if (userRole === "admin") return true;
  
  // Para otros roles, verificar si el estado está en su lista de permisos de detalles
  return DETAILS_PERMISSION[userRole].includes(videoStatus as VideoStatus);
}