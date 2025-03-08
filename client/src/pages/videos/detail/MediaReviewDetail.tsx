import { Video } from "@db/schema";
import { Badge } from "@/components/ui/badge";
import { 
  X, 
  Copy, 
  Download, 
  Youtube,
  Check,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { useState } from "react";
import { UpdateVideoData } from "@/hooks/useVideos";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Importamos los componentes modulares para cada estado
import { MediaReviewContent } from "./media-review/MediaReviewContent";
import { FinalReviewContent } from "./final-review/FinalReviewContent";
import { CompletedVideoContent } from "./completed/CompletedVideoContent";

export default function MediaReviewDetail({
  video,
  onUpdate
}: MediaReviewDetailProps) {
  const [videoNeedsCorrection, setVideoNeedsCorrection] = useState(false);
  const [thumbnailNeedsCorrection, setThumbnailNeedsCorrection] = useState(false);
  const [reviewComments, setReviewComments] = useState("");
  
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [videoPreviewOpen, setVideoPreviewOpen] = useState(false);
  const [youtubeDialogOpen, setYoutubeDialogOpen] = useState(false);
  
  const [linkCopied, setLinkCopied] = useState(false);
  
  const [youtubeUploadStatus, setYoutubeUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [youtubeUploadData, setYoutubeUploadData] = useState<{
    title: string;
    description: string;
    tags: string[];
    privacyStatus: 'public' | 'unlisted' | 'private';
  }>({
    title: video.optimizedTitle || video.title || "",
    description: video.optimizedDescription || video.description || "",
    tags: video.tags ? video.tags.split(',').map(tag => tag.trim()) : [],
    privacyStatus: 'unlisted'
  });

  // Funciones de manejo

  async function handleYouTubeUpload() {
    try {
      setYoutubeUploadStatus('uploading');
      
      // Simulación de carga
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Actualizar el vídeo con la URL de YouTube
      // En una implementación real, aquí se haría una carga real a YouTube
      const youtubeUrl = `https://youtube.com/watch?v=sample-${Date.now()}`;
      
      await onUpdate({
        youtubeUrl,
        status: 'completed'
      });
      
      setYoutubeUploadStatus('success');
      
      // Cerrar el diálogo después de un breve retraso
      setTimeout(() => {
        setYoutubeDialogOpen(false);
      }, 1500);
      
    } catch (error) {
      console.error('Error al subir a YouTube:', error);
      setYoutubeUploadStatus('error');
    }
  }

  function handleApprove() {
    onUpdate({ status: 'final_review' });
  }

  function handleCopyLink() {
    if (video.videoUrl) {
      navigator.clipboard.writeText(video.videoUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  }

  function handleDownload() {
    if (video.videoUrl) {
      const link = document.createElement('a');
      link.href = video.videoUrl;
      link.setAttribute('download', `${video.title || 'video'}.mp4`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  function handleReject() {
    if (!videoNeedsCorrection && !thumbnailNeedsCorrection) return;
    
    onUpdate({
      status: 'media_corrections',
      reviewComments
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
      
      {/* Modal de publicación en YouTube */}
      <Dialog open={youtubeDialogOpen} onOpenChange={setYoutubeDialogOpen}>
        <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center text-lg font-semibold">
              <Youtube className="mr-2 h-5 w-5 text-red-600" /> 
              Publicar en YouTube
            </DialogTitle>
            <DialogDescription>
              Configura los detalles para publicar este video en YouTube
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-6">
            <div className="space-y-2">
              <Label htmlFor="youtube-title">Título</Label>
              <Input 
                id="youtube-title"
                value={youtubeUploadData.title} 
                onChange={(e) => setYoutubeUploadData({
                  ...youtubeUploadData,
                  title: e.target.value
                })}
                className="w-full"
                disabled={youtubeUploadStatus === 'uploading'}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="youtube-description">Descripción</Label>
              <Textarea 
                id="youtube-description"
                value={youtubeUploadData.description} 
                onChange={(e) => setYoutubeUploadData({
                  ...youtubeUploadData,
                  description: e.target.value
                })}
                className="min-h-[150px]"
                disabled={youtubeUploadStatus === 'uploading'}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="youtube-privacy">Visibilidad</Label>
              <Select 
                value={youtubeUploadData.privacyStatus}
                onValueChange={(value: 'public' | 'unlisted' | 'private') => setYoutubeUploadData({
                  ...youtubeUploadData,
                  privacyStatus: value
                })}
                disabled={youtubeUploadStatus === 'uploading'}
              >
                <SelectTrigger id="youtube-privacy">
                  <SelectValue placeholder="Seleccionar visibilidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Privado</SelectItem>
                  <SelectItem value="unlisted">No listado</SelectItem>
                  <SelectItem value="public">Público</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setYoutubeDialogOpen(false)}
              disabled={youtubeUploadStatus === 'uploading'}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleYouTubeUpload}
              disabled={youtubeUploadStatus === 'uploading'}
              className={`
                ${youtubeUploadStatus === 'uploading' ? 'opacity-80 cursor-not-allowed' : ''}
                ${youtubeUploadStatus === 'success' ? 'bg-green-600 hover:bg-green-700' : ''}
                ${youtubeUploadStatus === 'error' ? 'bg-red-600 hover:bg-red-700' : ''}
              `}
            >
              {youtubeUploadStatus === 'idle' && (
                <>
                  <Youtube className="mr-2 h-4 w-4" />
                  Publicar en YouTube
                </>
              )}
              {youtubeUploadStatus === 'uploading' && "Publicando..."}
              {youtubeUploadStatus === 'success' && (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Publicado con éxito
                </>
              )}
              {youtubeUploadStatus === 'error' && "Error al publicar"}
            </Button>
          </DialogFooter>
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
                    className="absolute top-2 right-2 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded cursor-pointer hover:bg-black/80"
                    onClick={() => setVideoPreviewOpen(true)}
                  >
                    Ampliar
                  </div>
                  <div className="absolute bottom-2 right-2 flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 bg-black/60 text-white hover:bg-black/80 hover:text-white rounded-full"
                      onClick={handleCopyLink}
                    >
                      <Copy className="h-3 w-3" />
                      <span className="sr-only">Copiar enlace del video</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon" 
                      className="h-7 w-7 bg-black/60 text-white hover:bg-black/80 hover:text-white rounded-full"
                      onClick={handleDownload}
                    >
                      <Download className="h-3 w-3" />
                      <span className="sr-only">Descargar video</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="w-full h-[180px] bg-gray-100 dark:bg-gray-800 flex items-center justify-center rounded-md">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Video no disponible</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Card para el contenido optimizado */}
        <Card className="overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm mb-4">
          <div className="p-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Título Optimizado</h4>
                <div className="p-2 bg-white/60 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-md">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {video.optimizedTitle || video.title || "Sin título"}
                  </p>
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

        {/* Componentes de estados específicos */}
        <MediaReviewContent
          video={video}
          videoNeedsCorrection={videoNeedsCorrection}
          thumbnailNeedsCorrection={thumbnailNeedsCorrection}
          reviewComments={reviewComments}
          setVideoNeedsCorrection={setVideoNeedsCorrection}
          setThumbnailNeedsCorrection={setThumbnailNeedsCorrection}
          setReviewComments={setReviewComments}
          handleApprove={handleApprove}
          handleReject={handleReject}
        />

        <FinalReviewContent
          video={video}
          onUpdate={onUpdate}
          openYoutubeDialog={() => setYoutubeDialogOpen(true)}
        />

        <CompletedVideoContent
          video={video}
          handleCopyLink={handleCopyLink}
          handleDownload={handleDownload}
          linkCopied={linkCopied}
        />
      </div>
    </div>
  );
}

export interface MediaReviewDetailProps {
  video: Video;
  onUpdate: (data: UpdateVideoData) => Promise<void>;
}