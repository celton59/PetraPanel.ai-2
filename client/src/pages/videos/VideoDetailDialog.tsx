import { Badge } from "@/components/ui/badge";
import { VideoStatus } from "@db/schema";
import {
  AlertCircle,  
} from "lucide-react";
import {  
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { OptimizeContentDetail } from "./detail/OptimizeContentDetail";
import { ContentReviewDetail } from "./detail/OptimizeReviewContent";
import { UploadContentDetail } from "./detail/UploadContentDetail";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useUser } from "@/hooks/use-user";
import { getStatusBadgeColor, getStatusLabel } from "@/lib/status-labels";
import { canUserSeeVideoDetails } from "@/lib/role-permissions";
import MediaReviewDetail from "./detail/MediaReviewDetail";
import { MediaCorrectionsDetail } from "./detail/MediaCorrectionsDetail";
import { CompletedVideoDetail } from "./detail/CompletedVideoDetail";
import { ApiVideo } from "@/hooks/useVideos";
import { MascotLoader } from "@/components/ui/mascot-loader";
import { AffiliatesBadgeContainer } from "@/components/video/AffiliateBadge";
import { useVideoAffiliates } from "@/hooks/useVideoAffiliates";

const statusDescriptions: Record<VideoStatus, string> = {
  available: "Video recién creado, esperando asignación",
  content_corrections: "Video en proceso de optimización",
  content_review: "En revisión por el equipo de optimización",
  upload_media: "En revisión de archivos (video y miniatura)",
  media_review: "Listo para subir a YouTube",
  media_corrections: "Se han solicitado correcciones al video o miniatura",
  final_review: "En revisión final antes de publicación",
  completed: "Video publicado en YouTube",
};

export function VideoDetailDialog({ video }: VideoDetailDialogProps) {
  const { user, isLoading: isUserLoading } = useUser();
  
  // Cargar información de afiliados para este video
  const { 
    affiliates, 
    isLoading: isLoadingAffiliates,
  } = useVideoAffiliates(video?.id);
  
  // Si no hay video o usuario, mostrar estado de carga con mascota
  if (!video || !user || isUserLoading) {
    return (
      <DialogContent>
        <div className="flex items-center justify-center p-8">
          <MascotLoader 
            animation="thinking" 
            size="md" 
            text={!video ? "Cargando datos del video..." : "Verificando permisos..."}
          />
        </div>
      </DialogContent>
    );
  }

  // Determinar si el usuario tiene visibilidad según su rol y el estado del video
  const hasVisibility = user ? canUserSeeVideoDetails(user.role, video.status) : false;

  if (!hasVisibility) {
    return (
      <DialogContent>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No tienes acceso a ver el contenido de este video en este momento.
          </AlertDescription>
        </Alert>
      </DialogContent>
    );
  }

  function renderCardContent() {
    switch (video.status) {
      case "available":
      case "content_corrections":
        return (
          <OptimizeContentDetail video={video} />
        );
      case "content_review":
        return (
          <ContentReviewDetail video={video} />
        );
      case "upload_media":
        return (
          <UploadContentDetail video={video} />
        );
      case "media_corrections":
        return (
          <MediaCorrectionsDetail video={video} />
        );
      case "media_review":
      case "final_review":
        return <MediaReviewDetail video={video} />;
      case "completed":
        return <CompletedVideoDetail video={video} />;      
    }
  }

  const statusColor = getStatusBadgeColor(video.status)
  const statusLabel = getStatusLabel(video);

  return (
    <DialogContent className="w-[95vw] max-w-7xl p-6 overflow-hidden max-h-[92vh]">
      {/* Rich gradient accent for video detail */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 dark:from-blue-700 dark:via-purple-700 dark:to-blue-700"></div>
      
      <DialogHeader className="pb-2">
        <DialogTitle className="sr-only">Detalles del video</DialogTitle>
        <DialogDescription className="sr-only">Información y edición de detalles del video</DialogDescription>
        
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 truncate max-w-[450px]">
              {hasVisibility ? (
                (video.optimizedTitle ?? video.title)
              ) : (
                <span className="text-muted-foreground italic">
                  Título no disponible
                </span>
              )}
            </h2>
            
            {/* Badge de afiliados */}
            {!isLoadingAffiliates && affiliates && affiliates.length > 0 && (
              <div className="mt-1 mb-1">
                <AffiliatesBadgeContainer 
                  affiliates={affiliates.map(a => ({
                    id: a.id,
                    companyName: a.companyName,
                    isIncluded: a.includedByYoutuber
                  }))}
                />
              </div>
            )}
            
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {video.creatorName && `Creado por: ${video.creatorName}`}
            </p>
          </div>
          <div className="flex flex-col items-end">
            <Badge
              variant="outline"
              className={`${statusColor} border-0 text-md py-0.5 px-2.5 mb-1`}
            >
              {statusLabel}
            </Badge>
            <p className="text-xs text-muted-foreground">
              {statusDescriptions[video.status]}
            </p>
          </div>
        </div>
      </DialogHeader>

      <div className="overflow-y-auto pr-2 h-[calc(92vh-120px)]">
        {renderCardContent()}
      </div>
    </DialogContent>
  );
}

interface VideoDetailDialogProps {
  video: ApiVideo;
}
