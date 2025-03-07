import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { AlertCircle, Video as VideoIcon, Maximize2, Info } from "lucide-react";
import { VideoUploader } from "./upload/VideoUploader";
import { ThumbnailUploader } from "./upload/ThumbnailUploader";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ImagePreview } from "@/components/ui/image-preview";
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
              <div 
                className="group aspect-video bg-muted rounded-lg overflow-hidden relative" 
                onClick={() => video.videoUrl && window.open(video.videoUrl, '_blank')}
              >
                <video
                  src={video.videoUrl || undefined}
                  className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                  controls
                />
                
                {/* Indicador de clic para abrir */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="bg-black/50 p-2 rounded-full">
                    <Maximize2 className="h-5 w-5 text-white" />
                  </div>
                </div>
                
                {/* Brillo en los bordes al hacer hover */}
                <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity rounded-lg ring-2 ring-white/30 dark:ring-white/20"/>
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
                thumbnailUrl={video.thumbnailUrl}
                onUploadComplete={(url) => {
                  // La lógica de actualización se maneja en el componente padre
                }}
              />
            ) : video.thumbnailUrl ? (
              <div 
                className="group aspect-video bg-muted rounded-lg overflow-hidden" 
                onClick={() => video.thumbnailUrl && window.open(video.thumbnailUrl, '_blank')}
              >
                <ImagePreview
                  src={video.thumbnailUrl || ''}
                  alt="Miniatura del video"
                  aspectRatio="video"
                  enableZoom={true}
                  description="Previsualización de miniatura"
                  metaInfo="Haz clic para abrir en tamaño completo"
                  className="cursor-pointer transition-all"
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