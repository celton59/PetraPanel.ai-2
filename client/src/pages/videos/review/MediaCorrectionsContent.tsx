import { useState } from "react";
import { Video } from "@db/schema";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Video as VideoIcon, Image as ImageIcon, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { CorrectionUploadFields } from "./CorrectionUploadFields";
import { UpdateVideoData } from "@/hooks/useVideos";

interface MediaCorrectionsContentProps {
  video: Video;
  onUpdate: (videoId: number, data: UpdateVideoData) => Promise<void>;
}

export function MediaCorrectionsContent({ video, onUpdate }: MediaCorrectionsContentProps) {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Asegurarnos de acceder correctamente a la estructura de corrections
  const corrections = video.metadata?.corrections;
  const files = corrections?.files || {};

  // Verificar si se necesitan correcciones específicas
  const needsVideoCorrection = files.video?.needsCorrection || false;
  const needsThumbnailCorrection = files.thumbnail?.needsCorrection || false;

  const uploadFile = async (file: File, type: 'video' | 'thumbnail') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    formData.append('videoId', video.id.toString());
    formData.append('bucket', 'videos');

    try {
      const response = await fetch('/api/videos/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Error al subir el ${type}`);
      }

      const data = await response.json();
      return data.url;
    } catch (error: any) {
      console.error(`Error uploading ${type}:`, error);
      throw new Error(error.message || `Error al subir el ${type}`);
    }
  };

  const handleUpload = async () => {
    if (!videoFile && !thumbnailFile) {
      toast.error("Se requiere al menos un archivo para subir");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      let videoUrl = video.videoUrl;
      let thumbnailUrl = video.thumbnailUrl;

      if (videoFile && needsVideoCorrection) {
        videoUrl = await uploadFile(videoFile, 'video');
        setUploadProgress(50);
      }

      if (thumbnailFile && needsThumbnailCorrection) {
        thumbnailUrl = await uploadFile(thumbnailFile, 'thumbnail');
        setUploadProgress(100);
      }

      const allCorrectionsDone = 
        (!needsVideoCorrection || (needsVideoCorrection && videoFile)) &&
        (!needsThumbnailCorrection || (needsThumbnailCorrection && thumbnailFile));

      await onUpdate(video.id, {
        status: allCorrectionsDone ? "review" : "media_corrections",
        videoUrl: videoFile ? videoUrl : video.videoUrl,
        thumbnailUrl: thumbnailFile ? thumbnailUrl : video.thumbnailUrl,
      });

      toast.success("Archivos subidos correctamente");
      setVideoFile(null);
      setThumbnailFile(null);
    } catch (error: any) {
      console.error("Error al subir:", error);
      toast.error(error.message || "Error al subir los archivos");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Si no hay correcciones necesarias, no renderizamos nada
  if (!needsVideoCorrection && !needsThumbnailCorrection) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Alerta principal con instrucciones claras */}
      <Alert variant="destructive" className="bg-destructive/10">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Correcciones Necesarias</AlertTitle>
        <AlertDescription>
          <p className="text-sm mt-1">{video.lastReviewComments}</p>
          <div className="mt-2 space-y-1">
            {needsVideoCorrection && (
              <div className="flex items-center gap-2 text-sm">
                <VideoIcon className="h-4 w-4" />
                <span>Se requiere corrección del video</span>
              </div>
            )}
            {needsThumbnailCorrection && (
              <div className="flex items-center gap-2 text-sm">
                <ImageIcon className="h-4 w-4" />
                <span>Se requiere corrección de la miniatura</span>
              </div>
            )}
          </div>
        </AlertDescription>
      </Alert>

      <CorrectionUploadFields
        videoFile={videoFile}
        thumbnailFile={thumbnailFile}
        onVideoFileChange={setVideoFile}
        onThumbnailFileChange={setThumbnailFile}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
        needsVideoCorrection={needsVideoCorrection}
        needsThumbnailCorrection={needsThumbnailCorrection}
      />

      <div className="flex justify-end">
        <Button
          onClick={handleUpload}
          disabled={isUploading || (!videoFile && !thumbnailFile)}
          className="min-w-[200px]"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Subiendo...
            </>
          ) : (
            "Subir Correcciones"
          )}
        </Button>
      </div>

      {/* Historial de correcciones */}
      {corrections?.history?.length > 0 && (
        <Card className="p-4 space-y-3">
          <h3 className="font-medium text-sm">Historial de Correcciones</h3>
          <ScrollArea className="h-[200px]">
            <div className="space-y-4">
              {corrections.history.map((correction: any, index: number) => (
                <Alert 
                  key={index}
                  variant="destructive" 
                  className="bg-destructive/5 border-destructive/10"
                >
                  <AlertDescription className="text-destructive text-sm">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      <span className="font-medium">
                        {new Date(correction.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-1">{correction.comment}</p>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </ScrollArea>
        </Card>
      )}
    </div>
  );
}