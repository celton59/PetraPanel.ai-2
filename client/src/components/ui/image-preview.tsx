import React, { useState, useEffect } from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Eye, ZoomIn, ZoomOut, X, Maximize2, Info } from "lucide-react";
import { IoImageOutline } from "react-icons/io5";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ImagePreviewProps {
  src: string | null;
  alt?: string;
  aspectRatio?: "auto" | "video" | "square";
  className?: string;
  onClick?: () => void;
  enableZoom?: boolean;
  previewTitle?: string;
  showPlaceholder?: boolean;
  description?: string;
  metaInfo?: string;
}

export function ImagePreview({
  src,
  alt = "Imagen",
  aspectRatio = "video",
  className,
  onClick,
  enableZoom = true,
  previewTitle = "Vista previa",
  showPlaceholder = true,
  description,
  metaInfo,
}: ImagePreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isHovered, setIsHovered] = useState(false);

  // Reset loading state when src changes
  useEffect(() => {
    setIsLoading(true);
    setIsError(false);
  }, [src]);

  // Handle aspect ratio class
  const aspectClasses = {
    "auto": "",
    "video": "aspect-video",
    "square": "aspect-square",
  };

  // Handle zoom in and out
  const zoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 3));
  const zoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  const resetZoom = () => setZoomLevel(1);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (enableZoom && src) {
      setImagePreviewOpen(true);
    }
  };

  return (
    <>
      <div
        className={cn(
          "group relative rounded-lg overflow-hidden",
          aspectClasses[aspectRatio],
          className,
          src && !isLoading && !isError && "hover:shadow-[0_0_15px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-shadow duration-300"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Skeleton loader */}
        {isLoading && showPlaceholder && (
          <div className="absolute inset-0 z-10 bg-muted flex items-center justify-center">
            <IoImageOutline className="h-10 w-10 text-muted-foreground/30" />
          </div>
        )}

        {/* Error state */}
        {isError && showPlaceholder && (
          <div className="absolute inset-0 bg-muted flex items-center justify-center">
            <IoImageOutline className="h-10 w-10 text-muted-foreground/30" />
          </div>
        )}

        {/* Actual image */}
        {src && !isError ? (
          <img
            src={src}
            alt={alt}
            className={cn(
              "w-full h-full object-cover transition-all duration-300",
              isLoading ? "opacity-0" : "opacity-100",
              onClick && "cursor-pointer",
              "group-hover:scale-[1.03]" // Efecto zoom suave al hacer hover
            )}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setIsError(true);
            }}
            onClick={handleClick}
            loading="lazy"
            style={{transformOrigin: 'center center'}}
          />
        ) : !isError && showPlaceholder ? (
          <div className="absolute inset-0 bg-muted flex items-center justify-center">
            <IoImageOutline className="h-10 w-10 text-muted-foreground/30" />
          </div>
        ) : null}

        {/* Hover overlay con información y efecto de oscurecimiento */}
        {src && !isLoading && !isError && (
          <div 
            className={cn(
              "absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent",
              "opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3"
            )}
          >
            {description && (
              <p className="text-white text-sm font-medium mb-1 line-clamp-2">{description}</p>
            )}
            {metaInfo && (
              <p className="text-white/80 text-xs">{metaInfo}</p>
            )}
          </div>
        )}

        {/* Iconos de zoom y maximizar en hover */}
        {src && !isLoading && !isError && (
          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {enableZoom && (
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 rounded-full bg-white/80 text-gray-800 hover:bg-white transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setImagePreviewOpen(true);
                }}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            )}
            {(description || metaInfo) && (
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 rounded-full bg-white/80 text-gray-800 hover:bg-white transition-colors"
              >
                <Info className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {/* Brillo en los bordes al hacer hover */}
        {src && !isLoading && !isError && (
          <div className={cn(
            "absolute inset-0 pointer-events-none",
            "opacity-0 group-hover:opacity-100 transition-opacity duration-300",
            "rounded-lg",
            "ring-2 ring-white/30 dark:ring-white/20"
          )}/>
        )}
      </div>

      {/* Lightbox dialog for zoomed view */}
      <Dialog open={imagePreviewOpen} onOpenChange={setImagePreviewOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/95">
          <DialogHeader className="p-4 bg-black/60">
            <DialogTitle className="text-white flex justify-between items-center">
              <span>{previewTitle}</span>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white hover:bg-white/20"
                  onClick={zoomOut}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white hover:bg-white/20"
                  onClick={resetZoom}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white hover:bg-white/20"
                  onClick={zoomIn}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white hover:bg-white/20"
                  onClick={() => setImagePreviewOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="p-1 relative overflow-auto" style={{ maxHeight: '80vh' }}>
            <div className="flex items-center justify-center min-h-[300px]">
              {src && (
                <img 
                  src={src} 
                  alt={alt} 
                  style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
                  className="max-w-full transition-transform duration-200" 
                />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}