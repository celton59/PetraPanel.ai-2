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
      <div className="p-4">
        {/* Estructura optimizada de 2 columnas para medios */}
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          {/* Columna 1: Miniatura */}
          <div className="overflow-hidden rounded-md border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-900/40 dark:to-gray-900/20 px-3 py-2 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Miniatura</h3>
            </div>
            <div className="p-3">
              {video.thumbnailUrl ? (
                <img
                  src={video.thumbnailUrl}
                  alt="Miniatura del video"
                  className="w-full h-auto rounded overflow-hidden object-cover max-h-[200px]"
                />
              ) : (
                <div className="w-full h-[150px] bg-gray-100 dark:bg-gray-800 flex items-center justify-center rounded-md">
                  <p className="text-sm text-gray-500 dark:text-gray-400">No hay miniatura disponible</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Columna 2: Video */}
          <div className="overflow-hidden rounded-md border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-900/40 dark:to-gray-900/20 px-3 py-2 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Video</h3>
            </div>
            <div className="p-3">
              {video.videoUrl ? (
                <video controls className="w-full h-auto rounded overflow-hidden max-h-[200px]">
                  <source src={video.videoUrl} type="video/mp4" />
                  Tu navegador no soporta la visualización del video.
                </video>
              ) : (
                <div className="w-full h-[150px] bg-gray-100 dark:bg-gray-800 flex items-center justify-center rounded-md">
                  <p className="text-sm text-gray-500 dark:text-gray-400">No hay video disponible</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Información Optimizada */}
        <Card className="overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm relative mb-4">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 dark:from-blue-600 dark:via-purple-600 dark:to-blue-600"></div>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1 rounded-md bg-blue-50 dark:bg-blue-900/50">
                <List className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-medium text-blue-700 dark:text-blue-300 text-sm">Contenido Optimizado</h3>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <h4 className="text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Título</h4>
                  <div className="p-2 bg-white/60 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-md">
                    <p className="text-sm text-gray-700 dark:text-gray-300">{video.optimizedTitle || video.title}</p>
                  </div>
                </div>
                
                {video.tags && (
                  <div>
                    <h4 className="text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Tags</h4>
                    <div className="flex flex-wrap gap-1.5 p-2 bg-white/60 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-md">
                      {video.tags.split(",").map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50">
                          {tag.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <h4 className="text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Descripción</h4>
                <div className="p-2 bg-white/60 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-md h-full max-h-[125px] overflow-y-auto">
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {video.optimizedDescription || video.description || "Sin descripción"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* YouTube Ready Decision - Media Review */}
        {video.status === "media_review" && (
          <Card className="overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 dark:from-amber-600 dark:via-amber-500 dark:to-amber-600"></div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-amber-50 dark:bg-amber-900/50">
                    <CheckCircle2 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h3 className="font-medium text-amber-700 dark:text-amber-300 text-sm">Verificación de Contenido</h3>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="py-1 h-7 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 border-0 text-white"
                    onClick={handleApprove}
                    disabled={videoNeedsCorrection || thumbnailNeedsCorrection}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Aprobar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="py-1 h-7"
                    onClick={handleReject}
                    disabled={!videoNeedsCorrection && !thumbnailNeedsCorrection}
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" />
                    Rechazar
                  </Button>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 rounded-md bg-white/80 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800">
                    <Checkbox
                      id="video-correction"
                      onCheckedChange={(checked) => setVideoNeedsCorrection(checked as boolean)}
                      className="border-amber-500 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                    />
                    <label htmlFor="video-correction" className="text-xs font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                      Necesita corregir Vídeo
                    </label>
                  </div>
                  
                  <div className="flex items-center gap-2 p-3 rounded-md bg-white/80 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800">
                    <Checkbox
                      id="thumbnail-correction"
                      onCheckedChange={(checked) => setThumbnailNeedsCorrection(checked as boolean)}
                      className="border-amber-500 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                    />
                    <label htmlFor="thumbnail-correction" className="text-xs font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                      Necesita corregir Miniatura
                    </label>
                  </div>
                </div>
                
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                    Comentarios de Revisión
                  </label>
                  <Textarea
                    placeholder="Escribe aquí los motivos del rechazo o sugerencias de mejora..."
                    value={reviewComments}
                    disabled={!videoNeedsCorrection && !thumbnailNeedsCorrection}
                    onChange={(e) => setReviewComments(e.target.value)}
                    className="min-h-[80px] resize-none text-xs bg-white/80 dark:bg-gray-900/60 border-amber-200 dark:border-amber-800/70 focus-visible:ring-amber-500/30 focus-visible:border-amber-300"
                  />
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Final Review Decision */}
        {video.status === "final_review" && (
          <Card className="overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 via-green-600 to-green-500 dark:from-green-600 dark:via-green-500 dark:to-green-600"></div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-green-50 dark:bg-green-900/50">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-medium text-green-700 dark:text-green-300 text-sm">Revisión Final</h3>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="py-1 h-7 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 border-0 text-white"
                    onClick={handleApprove}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Aprobar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="py-1 h-7"
                    onClick={handleReject}
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" />
                    Rechazar
                  </Button>
                </div>
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                  Comentarios de Revisión Final
                </label>
                <Textarea
                  placeholder="Escribe aquí los motivos del rechazo o sugerencias finales..."
                  value={reviewComments}
                  onChange={(e) => setReviewComments(e.target.value)}
                  className="min-h-[80px] resize-none text-xs bg-white/80 dark:bg-gray-900/60 border-green-200 dark:border-green-800/70 focus-visible:ring-green-500/30 focus-visible:border-green-300"
                />
              </div>
            </div>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
}

export interface MediaReviewDetailProps {
  video: Video;
  onUpdate: (data: UpdateVideoData) => Promise<void>;
}
