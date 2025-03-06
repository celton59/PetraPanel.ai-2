import React, { useState, useEffect } from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Eye, ZoomIn, ZoomOut, X } from "lucide-react";
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
}: ImagePreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

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
          "relative rounded-lg overflow-hidden",
          aspectClasses[aspectRatio],
          className
        )}
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
              "w-full h-full object-cover transition-opacity duration-200",
              isLoading ? "opacity-0" : "opacity-100",
              onClick && "cursor-pointer"
            )}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setIsError(true);
            }}
            onClick={handleClick}
            loading="lazy"
          />
        ) : !isError && showPlaceholder ? (
          <div className="absolute inset-0 bg-muted flex items-center justify-center">
            <IoImageOutline className="h-10 w-10 text-muted-foreground/30" />
          </div>
        ) : null}

        {/* Zoom indicator */}
        {enableZoom && src && !isLoading && !isError && (
          <Button
            size="icon"
            variant="ghost"
            className="absolute bottom-2 right-2 h-6 w-6 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleClick}
          >
            <ZoomIn className="h-3 w-3" />
          </Button>
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