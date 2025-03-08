import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { AlertCircle, Video as VideoIcon, Maximize2, Info, Download, Share2, Eye } from "lucide-react";
import { VideoUploader } from "./upload/VideoUploader";
import { ThumbnailUploader } from "./upload/ThumbnailUploader";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ImagePreview } from "@/components/ui/image-preview";
import { ThumbnailPreview } from "@/components/ui/thumbnail-preview";
import { VideoPreview } from "@/components/ui/video-preview";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { ApiVideo } from "@/hooks/useVideos";

interface FileSelectionForCorrectionsProps {
  video: ApiVideo;
  selectedFiles: {
    video: boolean;
    thumbnail: boolean;
  };
  onSelectionChange: (selection: { video: boolean; thumbnail: boolean }) => void;
}

export function FileSelectionForCorrections({
  video,
  selectedFiles,
  onSelectionChange,
}: FileSelectionForCorrectionsProps) {
  // Determinar si los archivos necesitan corrección basado en flags del video
  const needsVideoCorrection = video.mediaVideoNeedsCorrection || false;
  const needsThumbnailCorrection = video.mediaThumbnailNeedsCorrection || false;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Video Selection */}
        <Card className={`p-4 relative ${selectedFiles.video ? "ring-2 ring-primary" : ""}`}>
          <div className="absolute top-3 right-3">
            <Checkbox
              checked={selectedFiles.video}
              disabled={video.status === "media_corrections"}
              onCheckedChange={(checked) =>
                onSelectionChange({
                  ...selectedFiles,
                  video: checked as boolean,
                })
              }
            />
          </div>
          <div className="space-y-3">
            <h3 className="font-medium">Video</h3>
            {video.status === "media_corrections" && needsVideoCorrection && selectedFiles.video ? (
              <VideoUploader
                videoUrl={video.videoUrl}
                onUploadComplete={(url) => {
                  // La lógica de actualización se maneja en el componente padre
                }}
              />
            ) : video.videoUrl ? (
              <motion.div 
                className="aspect-video bg-muted rounded-lg overflow-hidden" 
                initial={{ opacity: 0.8, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <VideoPreview
                  src={video.videoUrl || undefined}
                  alt={video.title || "Video"}
                  aspectRatio="video"
                  enableControls={true}
                  autoPlay={false}
                  muted={true}
                  loop={false}
                  title={video.optimizedTitle || video.title || "Video"}
                  description={video.description || undefined}
                  onShare={() => {
                    if (video.videoUrl) {
                      navigator.clipboard.writeText(video.videoUrl);
                      toast.success("Enlace de video copiado al portapapeles");
                    }
                  }}
                  onDownload={() => {
                    if (video.videoUrl) {
                      window.open(video.videoUrl, '_blank');
                    }
                  }}
                  className="w-full h-full"
                />
              </motion.div>
            ) : (
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <VideoIcon className="h-8 w-8 text-muted-foreground" />
                </motion.div>
              </div>
            )}
            {selectedFiles.video && (
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Solicitar corrección
              </div>
            )}
          </div>
        </Card>

        {/* Thumbnail Selection */}
        <Card className={`p-4 relative ${selectedFiles.thumbnail ? "ring-2 ring-primary" : ""}`}>
          <div className="absolute top-3 right-3">
            <Checkbox
              checked={selectedFiles.thumbnail}
              disabled={video.status === "media_corrections"}
              onCheckedChange={(checked) =>
                onSelectionChange({
                  ...selectedFiles,
                  thumbnail: checked as boolean,
                })
              }
            />
          </div>
          <div className="space-y-3">
            <h3 className="font-medium">Miniatura</h3>
            {video.status === "media_corrections" && needsThumbnailCorrection && selectedFiles.thumbnail ? (
              <ThumbnailUploader
                thumbnailUrl={video.thumbnailUrl}
                onUploadComplete={(url) => {
                  // La lógica de actualización se maneja en el componente padre
                }}
              />
            ) : video.thumbnailUrl ? (
              <div 
                className="group aspect-video bg-muted rounded-lg overflow-hidden" 
              >
                <ThumbnailPreview
                  src={video.thumbnailUrl || ''}
                  alt="Miniatura del video"
                  aspectRatio="video"
                  enableZoom={true}
                  title={video.optimizedTitle || video.title || "Miniatura del video"}
                  showHoverActions={true}
                  showPlayButton={false}
                  className="cursor-pointer transition-all"
                  onShare={() => {
                    if (video.thumbnailUrl) {
                      navigator.clipboard.writeText(video.thumbnailUrl);
                      toast.success("Enlace de miniatura copiado al portapapeles");
                    }
                  }}
                  onDownload={() => {
                    if (video.thumbnailUrl) {
                      window.open(video.thumbnailUrl, '_blank');
                    }
                  }}
                />
              </div>
            ) : (
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <img
                  src="/placeholder-thumbnail.svg"
                  alt="Miniatura no disponible"
                  className="h-8 w-8 text-muted-foreground"
                />
              </div>
            )}
            {selectedFiles.thumbnail && (
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Solicitar corrección
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}