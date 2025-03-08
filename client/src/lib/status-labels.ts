import { ApiVideo } from "@/types/api";
import { User } from "@/types/user";
import { VideoStatus } from "./constants";

export function getStatusLabel(role: User['role'], video: ApiVideo): string {
  const statusMap: Record<VideoStatus, string> = {
    available: "Disponible",
    content_corrections: "Correcciones de contenido",
    content_review: "Revisión de contenido",
    upload_media: "Subir media",
    media_corrections: "Correcciones de media",
    media_review: "Revisión de media",
    final_review: "Revisión final",
    completed: "Completado"
  };

  return statusMap[video.status as VideoStatus] || video.status;
}

export function getStatusBadgeColor(status: VideoStatus | string): string {
  const colorMap: Record<VideoStatus, string> = {
    available: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    content_corrections: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    content_review: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    upload_media: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    media_corrections: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    media_review: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
    final_review: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    completed: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300"
  };

  return colorMap[status as VideoStatus] || "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
}