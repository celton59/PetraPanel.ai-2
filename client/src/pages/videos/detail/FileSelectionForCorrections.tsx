import { Video } from "@db/schema";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { AlertCircle, Video as VideoIcon } from "lucide-react";
import { VideoUploader } from "./upload/VideoUploader";
import { ThumbnailUploader } from "./upload/ThumbnailUploader";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FileSelectionForCorrectionsProps {
  video: Video;
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
  // Determinar si los archivos necesitan corrección basado en metadata
  const needsVideoCorrection = video.metadata?.corrections?.files.video?.needsCorrection || false;
  const needsThumbnailCorrection = video.metadata?.corrections?.files.thumbnail?.needsCorrection || false;

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
                videoUrl={video.metadata?.corrections?.files.video?.originalUrl || video.videoUrl}
                onUploadComplete={(url) => {
                  // La lógica de actualización se maneja en el componente padre
                }}
              />
            ) : video.videoUrl ? (
              <div className="aspect-video bg-muted rounded-lg overflow-hidden cursor-pointer" onClick={() => window.open(video.videoUrl, '_blank')}>
                <video
                  src={video.videoUrl}
                  className="w-full h-full object-cover"
                  controls
                />
              </div>
            ) : (
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <VideoIcon className="h-8 w-8 text-muted-foreground" />
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
                thumbnailUrl={video.metadata?.corrections?.files.thumbnail?.originalUrl || video.thumbnailUrl}
                onUploadComplete={(url) => {
                  // La lógica de actualización se maneja en el componente padre
                }}
              />
            ) : video.thumbnailUrl ? (
              <div className="aspect-video bg-muted rounded-lg overflow-hidden cursor-pointer" onClick={() => window.open(video.thumbnailUrl, '_blank')}>
                <img
                  src={video.thumbnailUrl}
                  alt="Miniatura del video"
                  className="w-full h-full object-cover"
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