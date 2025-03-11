import { useState, useEffect, useRef } from "react";
import { IoImageOutline } from "react-icons/io5";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Maximize2,
  ZoomIn,
  ZoomOut,
  Eye,
  Info,
  Heart,
  Share2,
  Clock,
  ChevronRight,
  Play,
  Download,
} from "lucide-react";
import { motion } from "framer-motion";

interface ThumbnailPreviewProps {
  src: string | null;
  alt?: string;
  aspectRatio?: "auto" | "video" | "square";
  className?: string;
  onClick?: () => void;
  onShare?: () => void;
  onDownload?: () => void;
  enableZoom?: boolean;
  showPlaceholder?: boolean;
  showPlayButton?: boolean;
  showHoverActions?: boolean;
  duration?: string;
  viewCount?: number | string;
  publishDate?: string;
  likeCount?: number | string;
  tags?: string[];
  title?: string;
  previewTitle?: string;
}

export function ThumbnailPreview({
  src,
  alt = "Miniatura",
  aspectRatio = "video",
  className,
  onClick,
  onShare,
  onDownload,
  enableZoom = true,
  showPlaceholder = true,
  showPlayButton = false,
  showHoverActions = true,
  duration,
  viewCount,
  publishDate,
  likeCount,
  tags,
  title,
  previewTitle = "Vista previa",
}: ThumbnailPreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isHovered, setIsHovered] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const thumbRef = useRef<HTMLDivElement>(null);

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

  // Formato para numbers grandes
  const formatNumber = (num?: number | string): string => {
    if (num === undefined) return "";
    const n = typeof num === 'string' ? parseInt(num, 10) : num;
    if (isNaN(n)) return "";
    
    if (n >= 1000000) {
      return (n / 1000000).toFixed(1) + 'M';
    } else if (n >= 1000) {
      return (n / 1000).toFixed(1) + 'K';
    }
    return n.toString();
  };

  return (
    <>
      <div
        ref={thumbRef}
        className={cn(
          "group relative rounded-lg overflow-hidden transition-all duration-300",
          aspectClasses[aspectRatio],
          className,
          isHovered && "shadow-lg scale-[1.01]"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setShowInfo(false);
        }}
        onClick={handleClick}
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
        {src && (
          <img
            src={src}
            alt={alt}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setIsError(true);
            }}
            className={cn(
              "w-full h-full object-cover transition-all duration-300",
              isHovered && "scale-105 blur-[0.5px]"
            )}
          />
        )}
        
        {/* Play Button */}
        {showPlayButton && src && !isLoading && !isError && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div 
              initial={{ opacity: 0.6, scale: 0.8 }}
              whileHover={{ opacity: 1, scale: 1 }}
              className="bg-black/30 backdrop-blur-sm p-4 rounded-full transition-transform"
            >
              <Play fill="white" className="h-8 w-8 text-white" />
            </motion.div>
          </div>
        )}

        {/* Duration badge */}
        {duration && src && !isLoading && !isError && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
            {duration}
          </div>
        )}

        {/* Hover overlay con acciones */}
        {showHoverActions && src && !isLoading && !isError && (
          <div 
            className={cn(
              "absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 flex flex-col justify-between p-3 transition-opacity duration-300",
              isHovered ? "opacity-100" : "opacity-0"
            )}
          >
            {/* Top actions */}
            <div className="flex justify-end gap-1.5">
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
              
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 rounded-full bg-white/80 text-gray-800 hover:bg-white transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowInfo(!showInfo);
                }}
              >
                <Info className="h-4 w-4" />
              </Button>
              
              {onShare && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 rounded-full bg-white/80 text-gray-800 hover:bg-white transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onShare();
                  }}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              )}
              
              {onDownload && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 rounded-full bg-white/80 text-gray-800 hover:bg-white transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownload();
                  }}
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Bottom content */}
            <div className="space-y-1">
              {title && (
                <h4 className="text-white font-medium line-clamp-2 text-sm">{title}</h4>
              )}
              
              {/* Stats */}
              <div className="flex items-center gap-2 text-white/90 text-xs">
                {viewCount !== undefined && (
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span>{formatNumber(viewCount)}</span>
                  </div>
                )}
                
                {likeCount !== undefined && (
                  <div className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    <span>{formatNumber(likeCount)}</span>
                  </div>
                )}
                
                {publishDate && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{publishDate}</span>
                  </div>
                )}
                
                {/* Ver más indicator */}
                <div className="ml-auto flex items-center text-white/80">
                  <span className="text-xs">Ver</span>
                  <ChevronRight className="h-3 w-3" />
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Info overlay panel */}
        {showInfo && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm p-3 flex flex-col overflow-y-auto transition-opacity duration-300">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-white font-medium text-sm">Información</h3>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 rounded-full text-white hover:bg-white/20 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowInfo(false);
                }}
              >
                <Info className="h-3 w-3" />
              </Button>
            </div>
            
            <div className="space-y-2 text-xs text-white/90">
              {title && (
                <div>
                  <span className="block text-white/70">Título:</span>
                  <span className="block font-medium">{title}</span>
                </div>
              )}
              
              {publishDate && (
                <div>
                  <span className="block text-white/70">Publicado:</span>
                  <span className="block">{publishDate}</span>
                </div>
              )}
              
              {viewCount !== undefined && (
                <div>
                  <span className="block text-white/70">Visualizaciones:</span>
                  <span className="block">{formatNumber(viewCount)}</span>
                </div>
              )}
              
              {likeCount !== undefined && (
                <div>
                  <span className="block text-white/70">Likes:</span>
                  <span className="block">{formatNumber(likeCount)}</span>
                </div>
              )}
              
              {tags && tags.length > 0 && (
                <div>
                  <span className="block text-white/70">Etiquetas:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {tags.map((tag, i) => (
                      <span key={i} className="bg-white/20 px-1.5 py-0.5 rounded text-white text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
              <span>{previewTitle || title}</span>
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
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="relative overflow-auto h-[80vh] flex items-center justify-center">
            {src ? (
              <div 
                className="relative cursor-move" 
                style={{ 
                  transform: `scale(${zoomLevel})`,
                  transition: "transform 0.2s ease" 
                }}
              >
                <img 
                  src={src} 
                  alt={alt} 
                  className="max-w-full h-auto" 
                />
              </div>
            ) : (
              <div className="flex items-center justify-center p-8 text-white">
                <IoImageOutline className="h-16 w-16 text-white/30" />
                <p className="mt-4">No hay imagen disponible</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}