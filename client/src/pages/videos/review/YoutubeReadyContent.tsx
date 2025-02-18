import { Video } from "@db/schema";
import { Badge } from "@/components/ui/badge";
import {
  List,
  PlayCircle,
  Upload,
  AlertCircle,
  Image,
  Layout,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { UpdateVideoData } from "@/hooks/useVideos";
import { toast } from "sonner";

export default function YoutubeReadyContent({
  video,
  onUpdate,
}: YoutubeReadyContentProps) {
  const { user } = useUser();

  const [reviewComments, setReviewComments] = useState<string | undefined>(
    undefined,
  );
  const [videoApproved, setVideoApproved] = useState<boolean>(false);
  const [thumbnailsApproved, setThumbnailsApproved] = useState<boolean>(false);
  const [contentApproved, setContentApproved] = useState<boolean>(false);

  function handleApprove() {
    onUpdate(video.id, {
      status: "review",
      mediaReviewedBy: user?.id,
    });
  }

  function handleReject() {

    if (! reviewComments) {
      console.log("Debes de escribir un comentario para rechazar el video")
      toast("Debes de escribir un comentario para rechazar el video");
      return
    }
    
    onUpdate(video.id, {
      status: "media_corrections",
      mediaReviewedBy: user?.id,
      mediaReviewComments: [...(video.mediaReviewComments ?? []), reviewComments]
    });
  }

  return (
    <ScrollArea className="h-[80vh] sm:h-[70vh]">
      <div className="space-y-6 p-5">
        {/* Previsualización de Miniatura */}
        {video.thumbnailUrl && (
          <div className="rounded-lg overflow-hidden border bg-card">
            <div className="aspect-video relative">
              {video.thumbnailUrl ? (
                <img
                  src={video.thumbnailUrl}
                  alt="Miniatura del video"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                  <Layout className="h-4 w-4" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Información Optimizada */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <List className="h-4 w-4" />
              Contenido Optimizado
            </div>
            <div className="rounded-lg border bg-card p-4 space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-1">Título</h4>
                <p className="text-sm">{video.optimizedTitle || video.title}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Descripción</h4>
                <p className="text-sm whitespace-pre-wrap">
                  {video.optimizedDescription || video.description}
                </p>
              </div>
              {video.tags && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {video.tags.split(",").map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex justify-evenly">
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
        </div>

        <Card className="mt-4 p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Decisión</h3>
              <div className="flex items-center gap-2">
                {/* <Button
                  onClick={() => handleSubmit(true)}
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Aprobar
                 </Button> */}
                {/*<Button
                  variant="destructive"
                  onClick={() => handleSubmit(false)}
                  disabled={isSubmitting || !titleCorrections?.trim()}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Rechazar
                </Button> */}
              </div>
            </div>

            <Separator />

            <div>
              <Checkbox
                onCheckedChange={(cheked) =>
                  setVideoApproved(cheked as boolean)
                }
              />
              <label className="ms-3 text-sm font-medium">Video correcto</label>
            </div>

            <div>
              <Checkbox
                onCheckedChange={(cheked) =>
                  setThumbnailsApproved(cheked as boolean)
                }
              />
              <label className="ms-3 text-sm font-medium">
                Miniatura correcta
              </label>
            </div>

            <div>
              <Checkbox
                onCheckedChange={(cheked) =>
                  setContentApproved(cheked as boolean)
                }
              />
              <label className="ms-3 text-sm font-medium">
                Contenido correcto
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Comentarios de Revisión
              </label>
              <Textarea
                placeholder="Escribe aquí los motivos del rechazo o sugerencias de mejora..."
                value={reviewComments}
                disabled={
                  videoApproved && thumbnailsApproved && contentApproved
                }
                onChange={(e) => setReviewComments(e.target.value)}
                className="min-h-[100px] resize-none"
              />

              <Button
                variant="default"
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                onClick={handleApprove}
              >
                <Upload className="mr-2 h-4 w-4" />
                Listo para YouTube
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive ms-2"
                onClick={handleReject}
                disabled={
                  videoApproved && thumbnailsApproved && contentApproved
                }
              >
                <AlertCircle className="mr-2 h-4 w-4" />
                Solicitar Correcciones
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </ScrollArea>
  );
}

export interface YoutubeReadyContentProps {
  video: Video;
  onUpdate: (videoId: number, data: UpdateVideoData) => Promise<void>;
}
