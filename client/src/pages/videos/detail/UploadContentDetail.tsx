import { useState } from "react";
import { AlertCircle, Loader2, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { VideoUploadFields } from "./upload/VideoUploadFields";
import { ApiVideo, useVideos } from "@/hooks/useVideos";
import {
  Accordion,
  AccordionItem,
  AccordionContent,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUser } from "@/hooks/use-user";
import { VideoUploader, UploadProgressState } from "@/services/videoUploader";
import { AffiliateManager } from "@/components/video/AffiliateManager";
import api from '../../../lib/axios'

interface UploadContentDetailProps {
  video: ApiVideo;
}

export function UploadContentDetail({
  video,
}: UploadContentDetailProps) {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgressState | undefined>(undefined);
  const [uploader, setUploader] = useState<VideoUploader | null>(null);

  const { sendVideoToMediaReview, manageVideoYoutuber } = useVideos()
  const { user } = useUser();

  async function uploadThumbnail (file: File): Promise<void> {
    const formData = new FormData();
    formData.append("file", file);

    try {
      // Importamos api y refreshCSRFToken de nuestro archivo axios mejorado
      const { refreshCSRFToken } = await import('../../../lib/axios');
      
      
      // Refrescar proactivamente el token CSRF antes de esta operación importante
      await refreshCSRFToken();
      
      // Usar nuestra instancia de axios configurada con manejo CSRF
      await api.post(
        `/api/projects/${video.projectId}/videos/${video.id}/uploadThumbnail`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
    } catch (error: any) {
      console.error(`Error uploading thumbnail:`, error);
      
      // Manejo mejorado de errores de CSRF
      if (error.response?.status === 403 && 
          (error.response?.data?.message?.includes('CSRF') || 
           error.response?.data?.message?.includes('token') || 
           error.response?.data?.message?.includes('Token'))) {
        throw new Error("Error de validación de seguridad. Intente de nuevo.");
      }
      
      throw new Error(error.response?.data?.message || error.message || `Error al subir la miniatura`);
    }
  }

  // Función para manejar la cancelación de la carga
  async function handleCancelUpload () {
    if (uploader) {
      try {
        await uploader.cancel();
        setUploader(null);
        setIsUploading(false);
        setUploadProgress(undefined);
        console.log("Carga cancelada");
      } catch (error) {
        console.error("Error al cancelar la carga:", error);
        toast.error("Error al cancelar la carga");
      }
    }
  };

  async function handleUpload() {
    if (!videoFile && !thumbnailFile && !video.mediaReviewComments?.at(0)) {
      toast.error("Se requiere al menos un archivo para subir");
      return;
    }

    setIsUploading(true);
    let videoUrl: string | undefined;

    try {
      // Subida de video usando carga multiparte
      if (videoFile) {
        // Crear la instancia del uploader
        const videoUploader = new VideoUploader(video.projectId, video.id, videoFile);
        setUploader(videoUploader);
        
        // Configurar el callback de progreso
        videoUploader.onProgress((progressState) => {
          setUploadProgress(progressState);
        });
        
        // Iniciar la carga multiparte
        videoUrl = await videoUploader.upload();
        
        // Limpiar el uploader después de completar
        setUploader(null);
      }

      // Subida de miniatura (mantiene el método anterior)
      if (thumbnailFile) {
        await uploadThumbnail(thumbnailFile);
      }

      // Actualizar el estado del video
      await sendVideoToMediaReview({
        contentUploadedBy: user?.id,
        videoUrl,
        videoId: video.id,
        projectId: video.projectId,
      })
      
      toast.success("Archivos subidos correctamente");
    } catch (error: any) {
      console.error("Error al subir:", error);
      toast.error(error.message || "Error al subir los archivos");
    } finally {
      setIsUploading(false);
      setUploadProgress(undefined);
    }
  }

  async function handleUnassign() {
    try {
      await manageVideoYoutuber({
        videoId: video.id,
        projectId: video.projectId,
        mode: 'unassign'
      })

      toast.success("Video desasignado correctamente");
    } catch (error: any) {
      console.error("Error al desasignar:", error);
      toast.error(error.message || "Error al desasignar");
    } finally {
      setIsUploading(false);
      setUploadProgress(undefined);
    }
    
  }
  
  return (
    <ScrollArea className="h-auto max-h-[75vh] overflow-y-auto">
      <div className="p-4">
        {/* Alerta de correcciones compacta */}      
        {video.mediaReviewComments?.at(0) && (
          <div className="mb-4">
            <div className="flex items-start p-3 rounded-md border border-red-200 dark:border-red-900/50 shadow-sm bg-gradient-to-r from-red-50/80 to-transparent dark:from-red-950/30 dark:to-transparent backdrop-blur-sm">
              <div className="flex-shrink-0 p-1 bg-red-100 dark:bg-red-900/40 rounded-full mr-2 mt-0.5">
                <AlertCircle className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center flex-wrap gap-2 mb-1">
                  <h3 className="text-xs font-medium text-red-700 dark:text-red-300">Corrección solicitada</h3>
                  
                  {/* Badges de corrección */}
                  {video.mediaVideoNeedsCorrection && (
                    <span className="inline-flex items-center rounded-full bg-red-100 dark:bg-red-900/40 px-2 py-0.5 text-xs font-medium text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/50">
                      Corregir Video
                    </span>
                  )}
                  {video.mediaThumbnailNeedsCorrection && (
                    <span className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
                      Corregir Miniatura
                    </span>
                  )}
                </div>
                <p className="text-xs text-red-700/90 dark:text-red-400/90 whitespace-pre-wrap">
                  {video.mediaReviewComments?.at(-1)}
                </p>
              </div>
            </div>

            {/* Historial de correcciones mejorado */}
            <Accordion type="single" collapsible className="mt-2 overflow-hidden rounded-md border border-gray-200 dark:border-gray-800 shadow-sm">
              <AccordionItem value="item-1" className="border-0">
                <AccordionTrigger className="px-3 py-2 text-xs font-medium bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-900/40 dark:to-transparent">
                  <div className="flex items-center">
                    <div className="p-1 rounded-full bg-red-50 dark:bg-red-900/30 mr-2">
                      <AlertCircle className="h-3 w-3 text-red-500 dark:text-red-400" />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300">
                      Historial de correcciones
                      <span className="ml-2 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40 text-[0.65rem] font-medium text-red-600 dark:text-red-300">
                        {video.mediaReviewComments?.length || 0}
                      </span>
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-3 py-2 space-y-2 bg-gradient-to-b from-gray-50/70 to-white dark:from-gray-900/30 dark:to-gray-900/10">
                  {video.mediaReviewComments?.map((comment, index) => (
                    <div 
                      key={index} 
                      className={`
                        relative flex flex-col p-2 rounded-md shadow-sm
                        ${index === video.mediaReviewComments!.length - 1 
                          ? "border border-red-300 dark:border-red-800 bg-gradient-to-r from-red-50/90 to-white dark:from-red-950/30 dark:to-gray-900/20" 
                          : "border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/40"
                        }
                      `}
                    >
                      <p className="text-xs text-red-700 dark:text-red-300 pl-3 border-l border-red-300 dark:border-red-700">
                        {comment}
                      </p>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )}

        {/* Título y descripción más compactos */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Subir Archivos</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Sube el video y la miniatura para continuar con el proceso
            </p>
          </div>
          <div className="flex gap-2">
            {/* Botón de desasignación - solo visible si hay contentUploadedBy */}
            {video.contentUploadedBy && (
              <Button
                onClick={handleUnassign}
                className="py-1 h-8 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 border-0 text-white"
                size="sm"
                disabled={isUploading}
              >
                <span className="flex items-center">
                  <UserX className="mr-1 h-3.5 w-3.5" />
                  Desasignar
                </span>
              </Button>
            )}

            <Button
              onClick={handleUpload}
              className="py-1 h-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0 text-white"
              size="sm"
              disabled={isUploading}
            >
              {isUploading ? (
                <span className="flex items-center">
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" /> 
                  Subiendo...
                </span>
              ) : !videoFile && !thumbnailFile ? 'Enviar archivos' : "Subir Archivos"}
            </Button>
          </div>
        </div>

        {/* Contenedor para los campos de carga */}
        <div className="bg-gradient-to-b from-gray-50/70 to-white dark:from-gray-900/30 dark:to-gray-900/10 border border-gray-200 dark:border-gray-800 rounded-md p-4 shadow-sm">
          <VideoUploadFields
            videoFile={videoFile}
            thumbnailFile={thumbnailFile}
            onVideoFileChange={setVideoFile}
            onThumbnailFileChange={setThumbnailFile}
            isUploading={isUploading}
            uploadProgress={uploadProgress || undefined}
            onCancelUpload={handleCancelUpload}
            video={video}
          />
        </div>

        {/* Componente de gestión de afiliados */}
        {video && video.id && (
          <div className="mt-4">
            <AffiliateManager video={video} className="overflow-hidden" />
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
