import { Video } from "@db/schema";
import { Badge } from "@/components/ui/badge";
import { List, CheckCircle2, XCircle } from "lucide-react";
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

export default function MediaReviewDetail({
  video,
  onUpdate,
}: MediaReviewDetailProps) {
  const { user } = useUser();

  const [reviewComments, setReviewComments] = useState<string | undefined>(
    undefined,
  );
  const [videoNeedsCorrection, setVideoNeedsCorrection] = useState<boolean>(false);
  const [thumbnailNeedsCorrection, setThumbnailNeedsCorrection] = useState<boolean>(false);

  function handleApprove() {
    if ( video.status === 'media_review') {
        onUpdate({
          status: "final_review",
          mediaReviewedBy: user?.id,
          mediaVideoNeedsCorrection: false,
          mediaThumbnailNeedsCorrection: false
        })
    }
    else {
      onUpdate({
        status: 'completed'
      })
    }
    
  }

  function handleReject() {
    if (!reviewComments) {
      toast.error("Debes de escribir un comentario para rechazar el video");
      return;
    }

    onUpdate({
      status: "media_corrections",
      mediaReviewedBy: user?.id,
      mediaReviewComments: [
        ...(video.mediaReviewComments ?? []),
        reviewComments,
      ],
      mediaVideoNeedsCorrection: videoNeedsCorrection,
      mediaThumbnailNeedsCorrection: thumbnailNeedsCorrection,
    });
  }

  return (
    <ScrollArea className="h-auto max-h-[70vh]">
      <div className="space-y-6 p-5">
        
        {/* Actual Thumbnail */}
        <div>
          {video.thumbnailUrl && (
            <>
              <h2 className="text-2xl font-semibold">Miniatura Actual</h2>
              <img
                src={video.thumbnailUrl}
                alt="Miniatura del video"
                className="w-full mt-2 rounded-md"
              />
            </>
          )}
        </div>

        {/* Actual Video */}
        <div>
          {video.videoUrl && (
            <>
              <h2 className="text-2xl font-semibold">Video Actual</h2>
              <video controls className="w-full mt-2 rounded-md">
                <source src={video.videoUrl} type="video/mp4" />
                Tu navegador no soporta la visualización del video.
              </video>
            </>
          )}
        </div>

        {/* Información Optimizada */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Card className="p-4 space-y-4">
              <div className="flex items-baseline gap-2 text-2xl font-medium">
                <List className="h-4 w-4" />
                <h2 className="font-semibold">Contenido Optimizado</h2>
              </div>
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
            </Card>
          </div>
        </div>

        {/* Youtube ready decision */}
        { video.status === "media_review" && 
          <Card className="mt-4 p-6">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Decisión</h3>

              <Separator />

              <div>
                <Checkbox
                  onCheckedChange={(cheked) =>
                    setVideoNeedsCorrection(cheked as boolean)
                  }
                />
                <label className="ms-3 text-sm font-medium">Necesita corregir Vídeo</label>
              </div>

              <div>
                <Checkbox
                  onCheckedChange={(cheked) =>
                    setThumbnailNeedsCorrection(cheked as boolean)
                  }
                />
                <label className="ms-3 text-sm font-medium">
                  Necesita corregir Miniatura
                </label>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Comentarios de Revisión
                </label>
                <Textarea
                  placeholder="Escribe aquí los motivos del rechazo o sugerencias de mejora..."
                  value={reviewComments}
                  disabled={ !videoNeedsCorrection && !thumbnailNeedsCorrection }
                  onChange={(e) => setReviewComments(e.target.value)}
                  className="min-h-[100px] resize-none"
                />            
              </div>

              {/* Buttons */}
              <div>
                <Button
                  variant="default"
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={handleApprove}
                  disabled={videoNeedsCorrection || thumbnailNeedsCorrection}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Aprobar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="ms-2 bg-red-600 hover:bg-red-700"
                  onClick={handleReject}
                  disabled={
                    !videoNeedsCorrection && !thumbnailNeedsCorrection
                  }
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Rechazar
                </Button>
              </div>

            </div>
          </Card>
        }

        {/* Final Review Decision */}
        { video.status === "final_review" && 
          <Card className="mt-4 p-6">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Decisión</h3>

              <Separator />

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Comentarios de Revisión
                </label>
                <Textarea
                  placeholder="Escribe aquí los motivos del rechazo o sugerencias de mejora..."
                  value={reviewComments}
                  onChange={(e) => setReviewComments(e.target.value)}
                  className="min-h-[100px] resize-none"
                />            
              </div>

              {/* Buttons */}
              <div>
                <Button
                  variant="default"
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={handleApprove}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Aprobar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="ms-2 bg-red-600 hover:bg-red-700"
                  onClick={handleReject}
                  disabled={
                    videoNeedsCorrection || thumbnailNeedsCorrection
                  }
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Rechazar
                </Button>
              </div>

            </div>
          </Card>
        }
        
      </div>
    </ScrollArea>
  );
}

export interface MediaReviewDetailProps {
  video: Video;
  onUpdate: (data: UpdateVideoData) => Promise<void>;
}
