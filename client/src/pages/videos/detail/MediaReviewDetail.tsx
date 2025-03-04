import { Video } from "@db/schema";
import { Badge } from "@/components/ui/badge";
import { 
  List, 
  CheckCircle2, 
  XCircle, 
  X, 
  Share2, 
  Download, 
  BarChart3,
  Copy, 
  ChevronRight,
  Facebook,
  Twitter,
  Linkedin,
  Mail,
  Link,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { UpdateVideoData } from "@/hooks/useVideos";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

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
  const [imagePreviewOpen, setImagePreviewOpen] = useState<boolean>(false);
  const [videoPreviewOpen, setVideoPreviewOpen] = useState<boolean>(false);
  const [linkCopied, setLinkCopied] = useState<boolean>(false);

  function handleApprove() {
    if (video.status === 'media_review') {
      onUpdate({
        status: "completed",
        mediaReviewedBy: user?.id,
        mediaVideoNeedsCorrection: false,
        mediaThumbnailNeedsCorrection: false
      });
    } else if (video.status === 'final_review') {
      onUpdate({
        status: 'completed'
      });
    }
  }
  
  function handleCopyLink() {
    if (video.videoUrl) {
      navigator.clipboard.writeText(video.videoUrl)
        .then(() => {
          setLinkCopied(true);
          toast.success("Enlace copiado al portapapeles");
          setTimeout(() => setLinkCopied(false), 2000);
        })
        .catch(() => {
          toast.error("No se pudo copiar el enlace");
        });
    }
  }
  
  function handleDownload() {
    if (video.videoUrl) {
      const link = document.createElement('a');
      link.href = video.videoUrl;
      link.download = `${video.optimizedTitle || video.title || 'video'}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Descarga iniciada");
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
    <div className="pb-4">
      {/* Modal de ampliación de miniatura */}
      <Dialog open={imagePreviewOpen} onOpenChange={setImagePreviewOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/95">
          <DialogTitle className="sr-only">Vista ampliada de miniatura</DialogTitle>
          <div className="p-1 relative">
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-2 right-2 z-10 rounded-full bg-black/60 text-white hover:bg-black/80 hover:text-white"
              onClick={() => setImagePreviewOpen(false)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Cerrar</span>
            </Button>
            {video.thumbnailUrl && (
              <img 
                src={video.thumbnailUrl} 
                alt="Miniatura ampliada" 
                className="w-full h-auto max-h-[80vh] object-contain mx-auto" 
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de ampliación de video */}
      <Dialog open={videoPreviewOpen} onOpenChange={setVideoPreviewOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/95">
          <DialogTitle className="sr-only">Vista ampliada de video</DialogTitle>
          <div className="p-1 relative">
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-2 right-2 z-10 rounded-full bg-black/60 text-white hover:bg-black/80 hover:text-white"
              onClick={() => setVideoPreviewOpen(false)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Cerrar</span>
            </Button>
            {video.videoUrl && (
              <video 
                controls 
                autoPlay 
                className="w-full h-auto max-h-[80vh]"
              >
                <source src={video.videoUrl} type="video/mp4" />
                Tu navegador no soporta la reproducción de video.
              </video>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      <div className="p-4">
        {/* Estructura optimizada de 2 columnas para medios */}
        <div className="grid md:grid-cols-2 gap-6 mb-5">
          {/* Columna 1: Miniatura */}
          <div className="overflow-hidden rounded-md border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-900/40 dark:to-gray-900/20 px-3 py-2 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Miniatura</h3>
            </div>
            <div className="p-3">
              {video.thumbnailUrl ? (
                <div className="relative group cursor-pointer" onClick={() => setImagePreviewOpen(true)}>
                  <img
                    src={video.thumbnailUrl || ''}
                    alt="Miniatura del video"
                    className="w-full h-auto rounded overflow-hidden object-cover max-h-[220px] transition-all duration-200 group-hover:opacity-95"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="bg-white/80 dark:bg-gray-800/80 p-1.5 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-400">
                        <path d="M15 3h6v6"></path>
                        <path d="M10 14 21 3"></path>
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                      </svg>
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                    Clic para ampliar
                  </div>
                </div>
              ) : (
                <div className="w-full h-[180px] bg-gray-100 dark:bg-gray-800 flex items-center justify-center rounded-md">
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
                <div className="relative group">
                  <video 
                    controls 
                    className="w-full h-auto rounded overflow-hidden max-h-[220px] transition-all duration-200 group-hover:opacity-95"
                    onClick={(e) => {
                      // Detener la propagación para evitar conflictos con los controles de reproducción
                      e.stopPropagation();
                    }}
                  >
                    <source src={video.videoUrl || ''} type="video/mp4" />
                    Tu navegador no soporta la visualización del video.
                  </video>
                  <div
                    className="absolute top-2 right-2 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded cursor-pointer"
                    onClick={() => setVideoPreviewOpen(true)}
                  >
                    Ver en pantalla completa
                  </div>
                </div>
              ) : (
                <div className="w-full h-[180px] bg-gray-100 dark:bg-gray-800 flex items-center justify-center rounded-md">
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
        <Card className="overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm relative mb-4">
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

        {/* Video Completado - Acciones adicionales */}
        {video.status === "completed" && (
          <Card className="overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm relative mb-4">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500 dark:from-purple-600 dark:via-indigo-600 dark:to-purple-600"></div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-purple-50 dark:bg-purple-900/50">
                    <CheckCircle2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="font-medium text-purple-700 dark:text-purple-300 text-sm">Video Publicado</h3>
                </div>
                <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white border-0">
                  Completado
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="col-span-1 md:col-span-1">
                  <div 
                    className="p-4 rounded-md border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/40 hover:bg-white/90 dark:hover:bg-gray-900/50 transition-all cursor-pointer flex items-center gap-3"
                    onClick={handleCopyLink}
                  >
                    <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/50">
                      {linkCopied ? (
                        <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <Link className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200">Compartir enlace</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Copia el enlace directo al video</p>
                    </div>
                  </div>
                </div>

                <div className="col-span-1 md:col-span-1">
                  <div 
                    className="p-4 rounded-md border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/40 hover:bg-white/90 dark:hover:bg-gray-900/50 transition-all cursor-pointer flex items-center gap-3"
                    onClick={handleDownload}
                  >
                    <div className="p-2 rounded-full bg-indigo-100 dark:bg-indigo-900/50">
                      <Download className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200">Descargar video</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Guardar video en tu dispositivo</p>
                    </div>
                  </div>
                </div>

                <div className="col-span-1 md:col-span-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div className="p-4 rounded-md border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/40 hover:bg-white/90 dark:hover:bg-gray-900/50 transition-all cursor-pointer flex items-center gap-3">
                        <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/50">
                          <Share2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200">Compartir en redes</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Publicar en redes sociales</p>
                        </div>
                        <ChevronRight className="h-4 w-4 ml-auto text-gray-400" />
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                      <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                        <Facebook className="h-4 w-4 text-blue-600" />
                        <span>Facebook</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                        <Twitter className="h-4 w-4 text-sky-500" />
                        <span>Twitter</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                        <Linkedin className="h-4 w-4 text-blue-700" />
                        <span>LinkedIn</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                        <Mail className="h-4 w-4 text-gray-600" />
                        <span>Correo electrónico</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-md border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Métricas estimadas</h4>
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-purple-600 dark:text-purple-400">
                    <BarChart3 className="h-3.5 w-3.5" />
                    Ver estadísticas completas
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">24.5K</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Visualizaciones est.</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">18.2%</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Tasa de interacción</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">4:23</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Tiempo de vis. promedio</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

export interface MediaReviewDetailProps {
  video: Video;
  onUpdate: (data: UpdateVideoData) => Promise<void>;
}
