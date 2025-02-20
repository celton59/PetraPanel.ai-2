import { VideoStatus, Video, User } from "@db/schema";



const statusLabels: Record<VideoStatus, string> = {
    pending: "Disponible",
    in_progress: "En Proceso",
    optimize_review: "En Revisión",
    title_corrections: "Necesita Correcciones",
    completed: "Completado",
    upload_review: "Revisión de subida",
    media_corrections: "Necesita Correcciones",
    youtube_ready: "Listo para Youtube",
    review: "Revisión final"    
}

export function getStatusLabel (role: User['role'], video: Video): string {

  if (video.status === 'optimize_review' && video.contentReviewComments?.at(0)) {
      return 'Corregido'
  }
  else if(video.status === 'youtube_ready' && video.mediaReviewComments?.at(0)) {
    return 'Corregido'
  }
  else 
    return statusLabels[video.status]
    
};

const statusColors = {
  pending: "bg-yellow-500/20 text-yellow-600",
  in_progress: "bg-blue-500/20 text-blue-600",
  title_corrections: "bg-red-500/20 text-red-600",
  optimize_review: "bg-pink-500/20 text-pink-600",
  upload_review: "bg-purple-500/20 text-purple-600",
  youtube_ready: "bg-green-500/20 text-green-600",
  review: "bg-indigo-500/20 text-indigo-600",
  media_corrections: "bg-red-500/20 text-red-600",
  completed: "bg-emerald-500/20 text-emerald-600",
};

export function getStatusBadgeColor(status: VideoStatus) {
  
  return statusColors[status] || "bg-gray-500/20 text-gray-600";
}