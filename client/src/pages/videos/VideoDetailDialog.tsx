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

  async function handleAdminEdit(data: UpdateVideoData) {
    await onUpdate(data);
    setIsEditing(false);
  }

  function renderCardContent() {
    switch (video.status) {
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
      case "pending":
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {video.optimizedDescription || video.description}
            </p>

            {video.tags && (
              <div className="flex flex-wrap gap-2">
                {video.tags.split(",").map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag.trim()}
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {new Date(
                video.updatedAt || video.createdAt || Date.now(),
              ).toLocaleDateString()}
            </div>

            <div className="space-y-4">
              {/* <VideoStatusControl
                videoId={video.id}
                currentStatus={video.status as VideoStatus}
                userRole={userRole}
                onUpdateStatus={(videoId, data) => onUpdate(videoId, data)}
              /> */}

              <Button
                size="sm"
                className="w-full flex items-center justify-center"
                onClick={async () => {
                  onUpdate({
                    status: "in_progress",
                    optimizedBy: user?.id,
                  });
                }}
              >
                <PlayCircle className="mr-2 h-4 w-4" />
                <span>Optimizar</span>
              </Button>

              {user?.role === "admin" && (
                <Dialog open={isEditing} onOpenChange={setIsEditing}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full flex items-center justify-center"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Editar (Admin)
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Editar Video</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                      <form
                        onSubmit={form.handleSubmit(handleAdminEdit)}
                        className="space-y-4"
                      >
                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            Título Original
                          </label>
                          <Input {...form.register("title")} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            Descripción Original
                          </label>
                          <Textarea {...form.register("description")} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            Título Optimizado
                          </label>
                          <Input {...form.register("optimizedTitle")} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            Descripción Optimizada
                          </label>
                          <Textarea
                            {...form.register("optimizedDescription")}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            Tags (separados por comas)
                          </label>
                          <Input {...form.register("tags")} />
                        </div>
                        <Button type="submit" className="w-full">
                          Guardar Cambios
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              )}

              {video.videoUrl && (
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={video.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Ver Video
                  </a>
                </Button>
              )}

              {video.thumbnailUrl && (
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={video.thumbnailUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Image className="mr-2 h-4 w-4" />
                    Ver Miniatura
                  </a>
                </Button>
              )}

              {video.youtubeUrl && (
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={video.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Youtube className="mr-2 h-4 w-4" />
                    Ver en YouTube
                  </a>
                </Button>
              )}
            </div>
          </div>
        );
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
