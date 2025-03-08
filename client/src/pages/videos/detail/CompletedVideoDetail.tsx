import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserBadges } from "@/components/video/UserBadges";
import { formatDate } from "@/lib/utils";
import { Copy, Download, ExternalLink, Info } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ThumbnailPreview } from "@/components/ui/thumbnail-preview";
import { toast } from "sonner";
import { ApiVideo } from "@/hooks/useVideos";

interface CompletedVideoDetailProps {
  video: ApiVideo;
}

export function CompletedVideoDetail({ video }: CompletedVideoDetailProps) {
  // Función para copiar texto al portapapeles
  function copyToClipboard(text: string, message: string) {
    navigator.clipboard.writeText(text).then(
      () => {
        toast.success(message);
      },
      () => {
        toast.error("Error al copiar al portapapeles");
      }
    );
  }

  // Función para abrir el video en una nueva pestaña
  function openVideoInNewTab() {
    if (video.videoUrl) {
      window.open(video.videoUrl, "_blank");
    } else {
      toast.error("URL de video no disponible");
    }
  }

  // Función para descargar el video
  function downloadVideo() {
    if (video.videoUrl) {
      const link = document.createElement("a");
      link.href = video.videoUrl;
      link.download = `${video.title || "video"}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      toast.error("URL de video no disponible para descarga");
    }
  }

  return (
    <div className="space-y-6">
      {/* Resumen del video completado */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl font-semibold">Resumen de video finalizado</CardTitle>
              <CardDescription>
                Video completado exitosamente el {formatDate(video.updatedAt, true)}
              </CardDescription>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
              Completado
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="metadata" className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="metadata">Metadata</TabsTrigger>
              <TabsTrigger value="preview">Vista previa</TabsTrigger>
              <TabsTrigger value="history">Historial</TabsTrigger>
            </TabsList>

            <TabsContent value="metadata" className="space-y-4">
              {/* Información principal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Título original</h3>
                    <p className="text-base">{video.title}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Título optimizado</h3>
                    <div className="flex items-center gap-2">
                      <p className="text-base font-medium">{video.optimizedTitle}</p>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-6 w-6" 
                        onClick={() => copyToClipboard(video.optimizedTitle || "", "Título copiado")}
                      >
                        <Copy className="h-3.5 w-3.5" />
                        <span className="sr-only">Copiar título</span>
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Descripción optimizada</h3>
                    <div className="flex items-start gap-2">
                      <p className="text-sm whitespace-pre-wrap">{video.optimizedDescription}</p>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-6 w-6 flex-shrink-0" 
                        onClick={() => copyToClipboard(video.optimizedDescription || "", "Descripción copiada")}
                      >
                        <Copy className="h-3.5 w-3.5" />
                        <span className="sr-only">Copiar descripción</span>
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Etiquetas</h3>
                    <div className="flex items-start gap-2">
                      <p className="text-sm">{video.tags}</p>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-6 w-6 flex-shrink-0" 
                        onClick={() => copyToClipboard(video.tags || "", "Etiquetas copiadas")}
                      >
                        <Copy className="h-3.5 w-3.5" />
                        <span className="sr-only">Copiar etiquetas</span>
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Miniatura</h3>
                    <div className="aspect-video w-full max-w-md mx-auto overflow-hidden rounded-md border">
                      <ThumbnailPreview
                        src={video.thumbnailUrl}
                        alt={video.title}
                        title={video.title}
                        aspectRatio="video"
                        enableZoom={true}
                        className="w-full h-full"
                        showPlaceholder={true}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-center gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => video.thumbnailUrl && window.open(video.thumbnailUrl, "_blank")}
                      disabled={!video.thumbnailUrl}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ver miniatura
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (video.thumbnailUrl) {
                          const link = document.createElement("a");
                          link.href = video.thumbnailUrl;
                          link.download = `${video.title || "thumbnail"}.jpg`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }
                      }}
                      disabled={!video.thumbnailUrl}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Descargar
                    </Button>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Información adicional */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">ID del video</h3>
                  <div className="flex items-center gap-2">
                    <p className="text-sm">{video.seriesNumber ? `${video.seriesNumber}` : video.id}</p>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-5 w-5" 
                      onClick={() => copyToClipboard(video.seriesNumber ? `${video.seriesNumber}` : `${video.id}`, "ID copiado")}
                    >
                      <Copy className="h-3 w-3" />
                      <span className="sr-only">Copiar ID</span>
                    </Button>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Proyecto</h3>
                  <p className="text-sm">Proyecto #{video.projectId}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Fecha de finalización</h3>
                  <p className="text-sm">{formatDate(video.updatedAt, true)}</p>
                </div>
              </div>
              
              {/* Sección de enlace de YouTube */}
              {video.youtubeUrl && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-md">
                  <div className="flex items-start gap-3">
                    <div className="text-red-600 dark:text-red-400 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-youtube">
                        <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
                        <path d="m10 15 5-3-5-3z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">Publicado en YouTube</h4>
                      <div className="flex items-center gap-2">
                        <a 
                          href={video.youtubeUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-sm underline text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                        >
                          {video.youtubeUrl}
                        </a>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-5 w-5" 
                          onClick={() => copyToClipboard(video.youtubeUrl || "", "Enlace de YouTube copiado")}
                        >
                          <Copy className="h-3 w-3" />
                          <span className="sr-only">Copiar enlace de YouTube</span>
                        </Button>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-7 text-xs border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40"
                          onClick={() => window.open(video.youtubeUrl, "_blank")}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Ver en YouTube
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              <div className="aspect-video w-full overflow-hidden rounded-md border bg-black">
                {video.videoUrl ? (
                  <video 
                    src={video.videoUrl} 
                    controls 
                    className="w-full h-full" 
                    poster={video.thumbnailUrl || undefined}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Video no disponible</p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-center gap-2 mt-2">
                <Button
                  variant="outline"
                  onClick={openVideoInNewTab}
                  disabled={!video.videoUrl}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir en nueva pestaña
                </Button>
                <Button
                  variant="outline"
                  onClick={downloadVideo}
                  disabled={!video.videoUrl}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar video
                </Button>
              </div>
              
              {/* Audio separation section would go here if needed */}
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Historial de colaboradores</h3>
                  <UserBadges video={video} compact={false} />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Línea de tiempo</h3>
                  <div className="space-y-3 pl-4 border-l-2 border-muted">
                    <div className="relative">
                      <div className="absolute w-3 h-3 bg-primary rounded-full -left-[25px] top-1"></div>
                      <p className="text-sm font-medium">Creación del video</p>
                      <p className="text-xs text-muted-foreground">{formatDate(video.createdAt, true)}</p>
                    </div>
                    
                    <div className="relative">
                      <div className="absolute w-3 h-3 bg-green-500 rounded-full -left-[25px] top-1"></div>
                      <p className="text-sm font-medium">Finalización</p>
                      <p className="text-xs text-muted-foreground">{formatDate(video.updatedAt, true)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}