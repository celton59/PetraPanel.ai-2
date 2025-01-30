import { VideoStatus } from "@db/schema";

export type Role = 'optimizer' | 'reviewer' | 'youtuber' | 'uploader' | 'admin' | 'viewer';

// Etiquetas específicas por rol
const roleSpecificLabels: Record<Role, Partial<Record<VideoStatus | string, string | ((previousStatus: string) => string)>>> = {
  optimizer: {
    pending: "Disponible",
    in_progress: "En Proceso",
    optimize_review: "En Revisión",
    title_corrections: "Con Correcciones",
    completed: "Completado",
    upload_review: "Completado",
    media_corrections: "Completado",
    youtube_ready: "Completado",
    disponible: "Título Disponible",
    en_revision: "En Revisión",
    needs_attention: "Necesita Atención"
  },
  reviewer: {
    optimize_review: (previousStatus: string, metadata?: any) => {
      if (metadata?.optimization?.approvalHistory?.length > 0) {
        const lastAction = metadata.optimization.approvalHistory[metadata.optimization.approvalHistory.length - 1];
        if (lastAction.action === 'rejected') {
          return "A Revisar";
        }
      }
      if (metadata?.secondaryStatus?.type === 'title_rejected') {
        return "A Revisar";
      }
      return "Disponible";
    },
    title_corrections: "Correcciones de Título",
    upload_review: "Rev. Archivos",
    en_revision: "En Revisión"
  },
  youtuber: {
    video_disponible: "Video Disponible",
    asignado: "Asignado",
    youtube_ready: "Listo para YouTube"
  },
  uploader: {},
  admin: {},
  viewer: {}
};

// Etiquetas predeterminadas
const defaultLabels: Record<VideoStatus | string, string> = {
  pending: "Pendiente",
  in_progress: "En Proceso",
  title_corrections: "Correcciones de Título",
  optimize_review: "Rev. Optimización",
  upload_review: "Rev. Archivos",
  youtube_ready: "Listo YouTube",
  review: "Rev. Final",
  media_corrections: "Correcciones de Archivos",
  completed: "Completado",
  en_revision: "En Revisión",
  needs_attention: "Necesita Atención"
};

export const getStatusLabel = (status: VideoStatus | string, role?: Role, previousStatus?: string): string => {
  // 1. Buscar etiqueta específica del rol
  if (role && roleSpecificLabels[role]?.[status]) {
    const label = roleSpecificLabels[role][status];
    return typeof label === 'function' ? label(previousStatus || '') : label;
  }

  // 2. Si no hay etiqueta específica, usar la predeterminada
  return defaultLabels[status] || status;
};