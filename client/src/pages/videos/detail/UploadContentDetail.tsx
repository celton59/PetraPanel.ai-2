import { useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { VideoUploadFields } from "./upload/VideoUploadFields";
import { ApiVideo, UpdateVideoData } from "@/hooks/useVideos";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Accordion,
  AccordionItem,
  AccordionContent,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUser } from "@/hooks/use-user";

interface UploadContentDetailProps {
  video: ApiVideo;
  onUpdate: (data: UpdateVideoData) => Promise<void>;
}

export function UploadContentDetail({
  video,
  onUpdate,
}: UploadContentDetailProps) {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { user } = useUser();

  async function uploadThumbnail (file: File): Promise<void> {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(
        `/api/projects/${video.projectId}/videos/${video.id}/uploadThumbnail`,
        { method: "POST", body: formData }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Error al subir el thumbnail`);
      }

    } catch (error: any) {
      console.error(`Error uploading thumbnail:`, error);
      throw new Error(error.message || `Error al subir la miniatura`);
    }
  }

  async function uploadVideo(file: File): Promise<{ url: string, uploadUrl?: string }> {

    try {
      const response = await fetch(
        `/api/projects/${video.projectId}/videos/${video.id}/uploadVideo`,
        {
          method: "POST",
          body: JSON.stringify({ originalName: file.name }),
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Error al subir el video`);
      }

      const data = await response.json();
      return {
        url: data.url,
        uploadUrl: data.uploadUrl,
      }
    } catch (error: any) {
      console.error(`Error uploading video:`, error);
      throw new Error(error.message || `Error al subir el video`);
    }
  }

  async function handleUpload() {
    if (!videoFile && !thumbnailFile && !video.mediaReviewComments?.at(0)) {
      toast.error("Se requiere al menos un archivo para subir");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    try {
      let videoUrl: string | undefined;

      if (videoFile) {
        const { url, uploadUrl } = await uploadVideo(videoFile);
        console.log("S3 presigned url", uploadUrl)
        const result = await fetch(uploadUrl!, {
            method: "PUT",
            body: videoFile,
            headers: { "Content-Type": videoFile.type },
        });
        console.log("RESULT", result)
        videoUrl = url
        setUploadProgress(50);
      }

      if (thumbnailFile) {
        await uploadThumbnail(thumbnailFile);
        setUploadProgress(100);
      }

      await onUpdate({
        status: "media_review",
        videoUrl: videoUrl,
        contentUploadedBy: user?.id,
      });
      
      toast.success("Archivos subidos correctamente");
    } catch (error: any) {
      console.error("Error al subir:", error);
      toast.error(error.message || "Error al subir los archivos");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }

  return (
    <ScrollArea className="h-[80vh] sm:h-[70vh]">
      <div className="space-y-6 p-6">
              
        {video.mediaReviewComments?.at(0) && (
          <>
            <Alert className="border-2 border-red-200 bg-red-50/50 dark:bg-red-950/10 dark:border-red-900/50">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <AlertDescription className="text-red-700 dark:text-red-300">
                <p className="font-medium mb-1">
                  Se han solicitado las siguientes correcciones:
                </p>                
                <p className="text-sm whitespace-pre-wrap">
                  {video.mediaReviewComments?.at(-1)}
                </p>
                { (video.mediaVideoNeedsCorrection || video.mediaThumbnailNeedsCorrection) && <div className="mt-2">
                  {video.mediaVideoNeedsCorrection && (
                    <span className="badge bg-red-500 text-white rounded-full px-2 py-1 mr-1">
                      Corregir Video
                    </span>
                  )}
                  {video.mediaThumbnailNeedsCorrection && (
                    <span className="badge bg-orange-500 text-white rounded-full px-2 py-1">
                      Corregir Miniatura
                    </span>
                  )}
                </div>}
                
              </AlertDescription>
            </Alert>

            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="item-1">
                <AccordionTrigger>Historial de correciones</AccordionTrigger>
                <AccordionContent>
                  {video.mediaReviewComments?.map((comment) => (
                    <Alert className="mb-1 border-2 border-red-200 bg-red-50/50 dark:bg-red-950/10 dark:border-red-900/50">
                      <AlertCircle className="h-5 w-5 text-red-500" />
                      <AlertDescription className="text-red-700 dark:text-red-300">
                        <p className="font-medium">{comment}</p>
                      </AlertDescription>
                    </Alert>
                  ))}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </>
        )}

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
          video={video}
        />

        <div className="flex justify-end">
          <Button
            onClick={handleUpload}
            className="min-w-[200px]"
          >
            {isUploading ? (<> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Subiendo... </>) : 
              !videoFile && !thumbnailFile ? 'Enviar archivos' : "Subir Archivos"
            }
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
}
