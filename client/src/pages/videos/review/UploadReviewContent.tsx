import { useState } from "react";
import type { Video } from "@db/schema";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { VideoUploadFields } from "./upload/VideoUploadFields";
import { UpdateVideoData } from "@/hooks/useVideos";

interface UploadReviewContentProps {
  video: Video;
  onUpdate: (videoId: number, data: UpdateVideoData) => Promise<void>;
}

export function UploadReviewContent({ video, onUpdate }: UploadReviewContentProps) {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  async function uploadFile (file: File, type: 'video' | 'thumbnail') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    formData.append('videoId', video.id.toString());
    formData.append('bucket', 'videos');

    try {
      const response = await fetch(`/api/projects/${video.projectId}/videos/${video.id}/upload`, {
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

  async function handleUpload () {
    if (!videoFile && !thumbnailFile) {
      toast.error("Se requiere al menos un archivo para subir");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    try {
      let videoUrl = video.videoUrl;
      let thumbnailUrl = video.thumbnailUrl;

      if (videoFile) {
        videoUrl = await uploadFile(videoFile, 'video');
        setUploadProgress(50);
      }

      if (thumbnailFile) {
        thumbnailUrl = await uploadFile(thumbnailFile, 'thumbnail');
        setUploadProgress(100);
      }

      await onUpdate(video.id, {
        status: "youtube_ready",
        videoUrl: videoFile ? videoUrl : video.videoUrl,
        thumbnailUrl: thumbnailFile ? thumbnailUrl : video.thumbnailUrl
      });
      toast.success("Archivos subidos correctamente");
    } catch (error: any) {
      console.error("Error al subir:", error);
      toast.error(error.message || "Error al subir los archivos");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">Subir Archivos</h2>
        <p className="text-muted-foreground">
          Sube el video y la miniatura para continuar con el proceso
        </p>
      </div>

      <VideoUploadFields
        videoFile={videoFile}
        thumbnailFile={thumbnailFile}
        onVideoFileChange={setVideoFile}
        onThumbnailFileChange={setThumbnailFile}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
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
            "Subir Archivos"
          )}
        </Button>
      </div>
    </div>
  );
}