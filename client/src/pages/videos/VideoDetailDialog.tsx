import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VideoStatus } from "@db/schema";
import {
  Clock,
  Edit,
  PlayCircle,
  Youtube,
  AlertCircle,
  Image,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { UpdateVideoData } from "@/hooks/useVideos";
import { VideoOptimizerContent } from "./review/VideoOptimizerContent";
import { OptimizeReviewContent } from "./review/OptimizeReviewContent";
import { UploadReviewContent } from "./review/UploadReviewContent";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useUser } from "@/hooks/use-user";
import { getStatusBadgeColor, getStatusLabel } from "@/lib/status-labels";
import YoutubeReadyContent from "./review/YoutubeReadyContent";
import { ApiVideo } from "@/hooks/useVideos";

const statusDescriptions: Record<VideoStatus, string> = {
  pending: "Video recién creado, esperando asignación",
  in_progress: "Video en proceso de optimización de título",
  title_corrections: "Se han solicitado correcciones al título",
  optimize_review: "En revisión por el equipo de optimización",
  upload_review: "En revisión de archivos (video y miniatura)",
  youtube_ready: "Listo para subir a YouTube",
  review: "En revisión final antes de publicación",
  media_corrections: "Se han solicitado correcciones al video o miniatura",
  completed: "Video publicado en YouTube",
};

export function VideoDetailDialog({ video, onUpdate }: VideoCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { user } = useUser();

  // Determinar si el usuario tiene visibilidad usando getRoleStatus
  // const hasVisibility = getRoleStatus(video.status as VideoStatus)[userRole] === 'disponible';
  // TODO
  const hasVisibility = true;

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
      case "pending":
      case "in_progress":
      case "title_corrections":
        return (
          <VideoOptimizerContent
            video={video}
            onUpdate={onUpdate}
          />
        );
      case "optimize_review":
        return (
          <OptimizeReviewContent
            video={video}
            onUpdate={onUpdate}
          />
        );
      case "upload_review":
      case "media_corrections":
        return (
          <UploadReviewContent
            video={video}
            onUpdate={onUpdate}
          />
        );
      case "youtube_ready":
      case "review":
        return <YoutubeReadyContent video={video} onUpdate={onUpdate} />;      
    }
  }

  const statusColor = getStatusBadgeColor(video.status)
  const statusLabel = getStatusLabel(user!.role, video);

  return (
    <DialogContent className="w-[95vw] max-w-3xl p-6">
      <DialogHeader>
        <div className="flex justify-between items-start">
          <DialogTitle className="text-2xl">
            {hasVisibility ? (
              (video.optimizedTitle ?? video.title)
            ) : (
              <span className="text-muted-foreground italic">
                Título no disponible
              </span>
            )}
          </DialogTitle>
          <div className="pe-6">
            <div className="flex justify-end">
              <Badge
                variant="outline"
                className={`${statusColor} border-0 text-lg py-1 px-2`}
              >
                {statusLabel}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {statusDescriptions[video.status]}
            </p>
          </div>
        </div>
      </DialogHeader>

      {renderCardContent()}
    </DialogContent>
  );
}

interface VideoCardProps {
  video: ApiVideo;
  onUpdate: (data: UpdateVideoData) => Promise<void>;
}
