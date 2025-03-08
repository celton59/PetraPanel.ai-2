import { VideoStatus, Video, User } from "@db/schema";



const statusLabels: Record<VideoStatus, string> = {
    available: "Disponible",
    content_review: "En Revisión",
    content_corrections: "Necesita Correcciones",
    completed: "Completado",
    upload_media: "Subida de medios",
    media_corrections: "Necesita Correcciones",
    media_review: "Listo para Youtube",
    final_review: "Revisión final"    
}

export function getStatusLabel (role: User['role'], video: Video): string {
  // Roles permitidos
  const allowedRoles = ['admin', 'reviewer', 'optimizer', 'youtuber', 'content_reviewer', 'media_reviewer'];
  
  // Verificamos que el rol sea uno de los permitidos
  const safeRole = allowedRoles.includes(role) ? role : 'admin';

  if (video.status === 'content_review' && video.contentReviewComments?.at(0)) {
      return 'Corregido';
  }
  else if(video.status === 'media_review' && video.mediaReviewComments?.at(0)) {
    return 'Corregido';
  }
  else {
    return statusLabels[video.status];
  }
};

const statusColors: Record<VideoStatus, string> = {
  available: "bg-yellow-500/20 text-yellow-600",
  content_corrections: "bg-red-500/20 text-red-600",
  content_review: "bg-pink-500/20 text-pink-600",
  upload_media: "bg-purple-500/20 text-purple-600",
  media_review: "bg-green-500/20 text-green-600",
  final_review: "bg-indigo-500/20 text-indigo-600",
  media_corrections: "bg-red-500/20 text-red-600",
  completed: "bg-emerald-500/20 text-emerald-600",
};

export function getStatusBadgeColor(status: VideoStatus) {
  
  return statusColors[status] || "bg-gray-500/20 text-gray-600";
}