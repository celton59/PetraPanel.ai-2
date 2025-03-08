import { useState } from "react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { cn } from "../../lib/utils";

interface ThumbnailPreviewProps {
  src?: string | null;
  alt?: string;
  className?: string;
  aspectRatio?: "video" | "square" | "portrait" | "custom";
  customRatio?: number;
  enableZoom?: boolean;
  showPlaceholder?: boolean;
  title?: string;
  duration?: string;
  onClick?: () => void;
}

export function ThumbnailPreview({
  src,
  alt = "Thumbnail",
  className,
  aspectRatio = "video",
  customRatio,
  enableZoom = false,
  showPlaceholder = true,
  title,
  duration,
  onClick
}: ThumbnailPreviewProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Define el ratio según el tipo
  const getRatio = () => {
    switch (aspectRatio) {
      case "video":
        return 16 / 9;
      case "square":
        return 1;
      case "portrait":
        return 3 / 4;
      case "custom":
        return customRatio || 16 / 9;
      default:
        return 16 / 9;
    }
  };

  const handleImageError = () => {
    setHasError(true);
  };

  const handleZoomToggle = () => {
    if (enableZoom) {
      setIsZoomed(!isZoomed);
    }
  };

  const placeholder = (
    <div className="flex items-center justify-center h-full w-full bg-muted rounded-md overflow-hidden">
      <div className="text-muted-foreground text-xs">Sin miniatura</div>
    </div>
  );

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md", 
        className,
        onClick && "cursor-pointer"
      )}
      onClick={onClick || (enableZoom ? handleZoomToggle : undefined)}
    >
      <AspectRatio ratio={getRatio()} className="bg-muted">
        {!src || hasError ? (
          showPlaceholder && placeholder
        ) : (
          <>
            <img
              src={src}
              alt={alt}
              className={cn(
                "object-cover w-full h-full transition-transform",
                isZoomed && "scale-110"
              )}
              onError={handleImageError}
            />
            
            {/* Overlay para título y duración */}
            {(title || duration) && (
              <div className="absolute inset-0 flex flex-col justify-between p-2 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity">
                {title && (
                  <div className="text-white text-sm font-medium drop-shadow-md line-clamp-2 mt-auto">
                    {title}
                  </div>
                )}
              </div>
            )}
            
            {/* Duración */}
            {duration && (
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                {duration}
              </div>
            )}
          </>
        )}
      </AspectRatio>
    </div>
  );
}