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
import { useForm } from "react-hook-form";
import { useState } from "react";
import { UpdateVideoData } from "@/hooks/useVideos";
import { OptimizeContentDetail } from "./detail/OptimizeContentDetail";
import { ContentReviewDetail } from "./detail/OptimizeReviewContent";
import { UploadContentDetail } from "./detail/UploadContentDetail";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useUser } from "@/hooks/use-user";
import { getStatusBadgeColor, getStatusLabel } from "@/lib/status-labels";
import { canUserSeeVideoDetails } from "@/lib/role-permissions";
import MediaReviewDetail from "./detail/MediaReviewDetail";
import { MediaCorrectionsDetail } from "./detail/MediaCorrectionsDetail";
import { ApiVideo } from "@/hooks/useVideos";

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

export function VideoDetailDialog({ video, onUpdate }: VideoDetailDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { user } = useUser();

  // Determinar si el usuario tiene visibilidad según su rol y el estado del video
  const hasVisibility = user ? canUserSeeVideoDetails(user.role, video.status) : false;

  if (!hasVisibility) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No tienes acceso a ver el contenido de este video en este momento.
        </AlertDescription>
      </Alert>
    );
  }

  const form = useForm<UpdateVideoData>({
    defaultValues: {
      title: video.title,
      description: video.description ?? "",
      optimizedTitle: video.optimizedTitle ?? "",
      optimizedDescription: video.optimizedDescription ?? "",
      tags: video.tags ?? "",
    },
  });


  function renderCardContent() {
    switch (video.status) {
      case "available":
      case "content_corrections":
        return (
          <OptimizeContentDetail
            video={video}
            onUpdate={onUpdate}
          />
        );
      case "content_review":
        return (
          <ContentReviewDetail
            video={video}
            onUpdate={onUpdate}
          />
        );
      case "upload_media":
        return (
          <UploadContentDetail
            video={video}
            onUpdate={onUpdate}
          />
        );
      case "media_corrections":
        return (
          <MediaCorrectionsDetail
            video={video}
            onUpdate={onUpdate}
          />
        );
      case "media_review":
      case "final_review":
        return <MediaReviewDetail video={video} onUpdate={onUpdate} />;      
    }
  }

  const statusColor = getStatusBadgeColor(video.status)
  const statusLabel = getStatusLabel(user!.role, video);

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
  onUpdate: (data: UpdateVideoData, keepDialog?: boolean) => Promise<void>;
}
