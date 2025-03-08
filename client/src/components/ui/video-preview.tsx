import { useState, useRef, useEffect } from "react";
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
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Download,
  Share2,
  Info,
  Settings,
  X
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface VideoPreviewProps {
  src: string | null;
  alt?: string;
  aspectRatio?: "auto" | "video" | "square";
  className?: string;
  onClick?: () => void;
  onShare?: () => void;
  onDownload?: () => void;
  enableControls?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  previewTitle?: string;
  title?: string;
  description?: string | null;
}

export function VideoPreview({
  src,
  alt = "Video",
  aspectRatio = "video",
  className,
  onClick,
  onShare,
  onDownload,
  enableControls = true,
  autoPlay = false,
  muted = true,
  loop = false,
  previewTitle = "Vista previa",
  title,
  description
}: VideoPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(muted);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [volume, setVolume] = useState(1);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoPreviewOpen, setVideoPreviewOpen] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const aspectClasses = {
    "auto": "",
    "video": "aspect-video",
    "square": "aspect-square",
  };

  // Formatear tiempo en segundos a formato MM:SS
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Manejar la reproducción/pausa
  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    
    setIsPlaying(!isPlaying);
  };

  // Manejar mute/unmute
  const toggleMute = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    if (!videoRef.current) return;
    
    if (isMuted) {
      videoRef.current.muted = false;
      videoRef.current.volume = volume;
    } else {
      videoRef.current.muted = true;
    }
    
    setIsMuted(!isMuted);
  };

  // Cambiar volumen
  const handleVolumeChange = (newVolume: number[]) => {
    if (!videoRef.current) return;
    
    const vol = newVolume[0];
    videoRef.current.volume = vol;
    setVolume(vol);
    
    if (vol === 0) {
      videoRef.current.muted = true;
      setIsMuted(true);
    } else if (isMuted) {
      videoRef.current.muted = false;
      setIsMuted(false);
    }
  };

  // Manejar cambio de progreso
  const handleProgressChange = (newProgress: number[]) => {
    if (!videoRef.current || !duration) return;
    
    const seekTime = (newProgress[0] / 100) * duration;
    videoRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
    setProgress(newProgress[0]);
  };

  // Actualizar progreso durante la reproducción
  const handleTimeUpdate = () => {
    if (!videoRef.current || !duration) return;
    
    const current = videoRef.current.currentTime;
    const percent = (current / duration) * 100;
    
    setCurrentTime(current);
    setProgress(percent);
  };

  // Obtener la duración al cargar los metadatos
  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    
    setDuration(videoRef.current.duration);
  };

  // Manejar el final del video
  const handleEnded = () => {
    setIsPlaying(false);
    if (loop && videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  // Avanzar 10 segundos
  const skipForward = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    if (!videoRef.current) return;
    
    videoRef.current.currentTime += 10;
  };

  // Retroceder 10 segundos
  const skipBackward = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    if (!videoRef.current) return;
    
    videoRef.current.currentTime -= 10;
  };

  // Entrar o salir de pantalla completa
  const toggleFullscreen = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error al intentar mostrar a pantalla completa: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // Monitorear cambios de pantalla completa
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Mostrar/ocultar controles cuando se mueve el mouse
  useEffect(() => {
    if (!enableControls) return;
    
    if (isHovered) {
      setShowControls(true);
      
      if (controlTimeoutRef.current) {
        clearTimeout(controlTimeoutRef.current);
      }
      
      controlTimeoutRef.current = setTimeout(() => {
        if (!showVolumeSlider && !showInfo) {
          setShowControls(false);
        }
      }, 3000);
    } else if (!showVolumeSlider && !showInfo) {
      controlTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 1000);
    }
    
    return () => {
      if (controlTimeoutRef.current) {
        clearTimeout(controlTimeoutRef.current);
      }
    };
  }, [isHovered, showVolumeSlider, showInfo, enableControls]);

  // Detectar pulsación de teclas para los controles
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!videoPreviewOpen && !isFullscreen) return;
      
      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          togglePlay();
          e.preventDefault();
          break;
        case 'm':
          toggleMute();
          e.preventDefault();
          break;
        case 'arrowright':
        case 'l':
          skipForward();
          e.preventDefault();
          break;
        case 'arrowleft':
        case 'j':
          skipBackward();
          e.preventDefault();
          break;
        case 'f':
          toggleFullscreen();
          e.preventDefault();
          break;
        case 'escape':
          if (showInfo) {
            setShowInfo(false);
            e.preventDefault();
          }
          break;
        case 'i':
          setShowInfo(prev => !prev);
          e.preventDefault();
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [videoPreviewOpen, isFullscreen, showInfo]);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (src) {
      setVideoPreviewOpen(true);
    }
  };

  return (
    <>
      <div
        ref={containerRef}
        className={cn(
          "group relative overflow-hidden transition-all duration-300",
          aspectClasses[aspectRatio],
          className,
          isHovered && "shadow-lg"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
      >
        {/* Video */}
        <video
          ref={videoRef}
          src={src || undefined}
          className={cn(
            "w-full h-full object-cover transition-transform duration-300",
            isHovered && !isPlaying && "scale-[1.02] blur-[0.5px]"
          )}
          poster={!src ? undefined : undefined}
          playsInline
          autoPlay={autoPlay}
          muted={muted}
          loop={loop}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          onClick={(e) => {
            e.stopPropagation();
            if (enableControls) togglePlay();
          }}
        />

        {/* Overlay con acciones */}
        <AnimatePresence>
          {enableControls && (showControls || isHovered || showInfo) && (
            <motion.div 
              className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 flex flex-col justify-between p-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Top actions bar */}
              <div className="flex justify-end gap-1.5">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setVideoPreviewOpen(true);
                  }}
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
                
                <Button
                  size="icon"
                  variant="ghost"
                  className={cn(
                    "h-7 w-7 rounded-full text-white transition-colors",
                    showInfo ? "bg-white/50 hover:bg-white/60" : "bg-white/20 hover:bg-white/40"
                  )}
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
                    className="h-7 w-7 rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors"
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
                    className="h-7 w-7 rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownload();
                    }}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Info panel */}
              {showInfo && title && (
                <motion.div 
                  className="absolute inset-0 bg-black/80 backdrop-blur-[2px] p-3 flex flex-col overflow-y-auto z-20"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-white font-medium">{title}</h3>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 rounded-full text-white hover:bg-white/20 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowInfo(false);
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  
                  {description && (
                    <p className="text-xs text-white/90 mt-1 line-clamp-6">
                      {description}
                    </p>
                  )}
                  
                  <div className="mt-2 pt-2 border-t border-white/20 text-xs text-white/70">
                    <p>Duración: {formatTime(duration)}</p>
                    {videoRef.current && (
                      <p className="mt-1">
                        Resolución: {videoRef.current.videoWidth}×{videoRef.current.videoHeight}
                      </p>
                    )}
                  </div>
                  
                  <div className="mt-auto pt-2 text-xs text-white/60">
                    <p className="flex items-center gap-1.5">
                      <kbd className="px-1.5 py-0.5 bg-white/10 rounded">Espacio</kbd>
                      <span>Reproducir/Pausar</span>
                    </p>
                    <p className="flex items-center gap-1.5 mt-1">
                      <kbd className="px-1.5 py-0.5 bg-white/10 rounded">M</kbd>
                      <span>Silenciar</span>
                    </p>
                    <p className="flex items-center gap-1.5 mt-1">
                      <kbd className="px-1.5 py-0.5 bg-white/10 rounded">F</kbd>
                      <span>Pantalla completa</span>
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Bottom controls */}
              <div className="space-y-2">
                {/* Progress bar */}
                <div 
                  className="group/progress relative h-1.5 bg-white/20 rounded overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-primary rounded"
                    style={{ width: `${progress}%` }}
                    layoutId="progressBar"
                  />
                  
                  <Slider
                    value={[progress]}
                    min={0}
                    max={100}
                    step={0.1}
                    onValueChange={handleProgressChange}
                    className="absolute inset-0 opacity-0 cursor-pointer group-hover/progress:opacity-100"
                  />
                </div>
                
                {/* Controls row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-white hover:bg-white/20 transition-colors rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        skipBackward(e);
                      }}
                    >
                      <SkipBack className="h-3.5 w-3.5" />
                    </Button>
                    
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 bg-white/30 text-white hover:bg-white/50 transition-colors rounded-full backdrop-blur-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePlay(e);
                      }}
                    >
                      {isPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4 ml-0.5" />
                      )}
                    </Button>
                    
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-white hover:bg-white/20 transition-colors rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        skipForward(e);
                      }}
                    >
                      <SkipForward className="h-3.5 w-3.5" />
                    </Button>
                    
                    <div 
                      className="relative ml-1"
                      onMouseEnter={() => setShowVolumeSlider(true)}
                      onMouseLeave={() => setShowVolumeSlider(false)}
                    >
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-white hover:bg-white/20 transition-colors rounded-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMute(e);
                        }}
                      >
                        {isMuted ? (
                          <VolumeX className="h-3.5 w-3.5" />
                        ) : (
                          <Volume2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      
                      {/* Volume slider */}
                      <AnimatePresence>
                        {showVolumeSlider && (
                          <motion.div 
                            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-24 h-6 bg-black/80 backdrop-blur-sm rounded px-3 flex items-center"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.15 }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Slider
                              value={[isMuted ? 0 : volume]}
                              min={0}
                              max={1}
                              step={0.01}
                              onValueChange={handleVolumeChange}
                              className="w-full"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    
                    <div className="ml-1 text-xs text-white/90 select-none">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </div>
                  </div>
                  
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-white hover:bg-white/20 transition-colors rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFullscreen(e);
                    }}
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Overlay para mostrar gran botón de play cuando no está reproduciendo */}
        {enableControls && !isPlaying && (
          <div 
            className={cn(
              "absolute inset-0 flex items-center justify-center pointer-events-none",
              isHovered ? "opacity-100" : "opacity-0", 
              "transition-opacity duration-300"
            )}
          >
            <div className="bg-black/30 backdrop-blur-sm p-3 rounded-full">
              <Play className="h-8 w-8 text-white" />
            </div>
          </div>
        )}
        
        {/* Brillo en los bordes al hacer hover */}
        <div 
          className={cn(
            "absolute inset-0 pointer-events-none transition-opacity duration-300 rounded-lg ring-2 ring-white/30 dark:ring-white/20",
            isHovered ? "opacity-100" : "opacity-0"
          )}
        />
      </div>

      {/* Dialog para vista ampliada */}
      <Dialog open={videoPreviewOpen} onOpenChange={setVideoPreviewOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/95">
          <DialogHeader className="p-4 bg-black/60">
            <DialogTitle className="text-white flex justify-between items-center">
              <span>{previewTitle || title}</span>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white hover:bg-white/20"
                  onClick={() => {
                    if (videoRef.current) {
                      videoRef.current.currentTime = 0;
                    }
                  }}
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white hover:bg-white/20"
                  onClick={() => setShowInfo(!showInfo)}
                >
                  <Info className="h-4 w-4" />
                </Button>
                {onDownload && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-white hover:bg-white/20"
                    onClick={onDownload}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="relative h-[70vh] flex items-center justify-center">
            {src ? (
              <div className="relative w-full h-full">
                <video
                  className="w-full h-full object-contain"
                  src={src}
                  controls
                  autoPlay
                />
              </div>
            ) : (
              <div className="flex items-center justify-center p-8 text-white">
                <p>No hay video disponible</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}