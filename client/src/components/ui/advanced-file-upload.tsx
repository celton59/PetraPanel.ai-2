import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThumbnailPreview } from "@/components/ui/thumbnail-preview";
import { VideoPreview } from "@/components/ui/video-preview";
import { toast } from "sonner";
import { X, Upload, FileText, Film, Image as ImageIcon, FileUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AdvancedFileUploadProps {
  accept?: string;
  onChange?: (file: File | null) => void;
  fileType?: 'image' | 'video' | 'any';
  maxSize?: number; // En bytes
  initialFile?: File | null;
  previewUrl?: string | null;
  className?: string;
  label?: string;
  sublabel?: string;
  loading?: boolean;
  disabled?: boolean;
  error?: string;
  showPreview?: boolean;
  fileTypeDescription?: string;
  previewAspectRatio?: "auto" | "video" | "square";
  allowReplacement?: boolean;
  actionLabel?: string;
  actionIcon?: React.ReactNode;
  onActionClick?: () => void;
}

export function AdvancedFileUpload({
  accept = "*/*",
  onChange,
  fileType = "any",
  maxSize = 1024 * 1024 * 100, // 100MB por defecto
  initialFile = null,
  previewUrl = null,
  className,
  label = "Selecciona un archivo",
  sublabel = "o arrastra y suelta aquí",
  loading = false,
  disabled = false,
  error,
  showPreview = true,
  fileTypeDescription,
  previewAspectRatio = "video",
  allowReplacement = true,
  actionLabel,
  actionIcon,
  onActionClick
}: AdvancedFileUploadProps) {
  const [file, setFile] = useState<File | null>(initialFile);
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const [previewObjectUrl, setPreviewObjectUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Determinar el tipo de archivo mostrado en el preview
  const getPreviewType = useCallback(() => {
    if (file) {
      if (file.type.startsWith('image/')) return 'image';
      if (file.type.startsWith('video/')) return 'video';
      return 'other';
    }
    
    if (previewUrl) {
      // Intentar determinar por la extensión
      const extension = previewUrl.split('.').pop()?.toLowerCase();
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '')) return 'image';
      if (['mp4', 'webm', 'ogg', 'mov'].includes(extension || '')) return 'video';
    }
    
    return 'other';
  }, [file, previewUrl]);
  
  // Manejar el cambio de archivo por input o drag & drop
  const handleFileChange = useCallback((newFile: File | null) => {
    // Limpiar la URL de objeto anterior si existe
    if (previewObjectUrl) {
      URL.revokeObjectURL(previewObjectUrl);
    }
    
    if (newFile) {
      // Validar tamaño
      if (maxSize && newFile.size > maxSize) {
        const sizeInMB = maxSize / (1024 * 1024);
        toast.error(`El archivo excede el tamaño máximo permitido (${sizeInMB} MB)`);
        return;
      }
      
      // Validar tipo
      if (fileType !== 'any') {
        if (fileType === 'image' && !newFile.type.startsWith('image/')) {
          toast.error("Por favor selecciona un archivo de imagen válido");
          return;
        }
        if (fileType === 'video' && !newFile.type.startsWith('video/')) {
          toast.error("Por favor selecciona un archivo de video válido");
          return;
        }
      }
      
      // Crear URL para la vista previa
      setPreviewObjectUrl(URL.createObjectURL(newFile));
    } else {
      setPreviewObjectUrl(null);
    }
    
    setFile(newFile);
    if (onChange) onChange(newFile);
  }, [onChange, fileType, maxSize, previewObjectUrl]);
  
  // Manejar el drag & drop
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev - 1);
    if (dragCounter <= 1) {
      setIsDragging(false);
      setDragCounter(0);
    }
  }, [dragCounter]);
  
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setDragCounter(0);
    
    if (disabled || loading) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  }, [disabled, loading, handleFileChange]);
  
  // Trigger file input click
  const triggerFileSelect = () => {
    if (fileInputRef.current && !disabled && !loading) {
      fileInputRef.current.click();
    }
  };
  
  // Manejar input file change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileChange(e.target.files[0]);
    }
  };
  
  // Eliminar archivo seleccionado
  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleFileChange(null);
    
    // Restablecer el input de archivo también
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Formatear tamaño de archivo
  const formatFileSize = (size: number): string => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  // Obtener icono según tipo de archivo
  const getFileIcon = () => {
    if (fileType === 'image') return <ImageIcon className="h-12 w-12 opacity-20" />;
    if (fileType === 'video') return <Film className="h-12 w-12 opacity-20" />;
    return <FileText className="h-12 w-12 opacity-20" />;
  };
  
  // Determinar qué mostrar
  const hasFile = file || previewUrl;
  const previewType = getPreviewType();
  const showPlaceholder = !hasFile || !showPreview;
  
  // Renderizar la vista previa según el tipo de archivo
  const renderPreview = () => {
    if (!hasFile || !showPreview) return null;
    
    const source = previewObjectUrl || previewUrl;
    if (!source) return null;
    
    if (previewType === 'image') {
      return (
        <div className="relative aspect-video max-h-48 overflow-hidden rounded-md">
          <ThumbnailPreview
            src={source}
            aspectRatio={previewAspectRatio}
            showHoverActions={true}
            enableZoom={true}
            showPlayButton={false}
            className="h-full w-full object-cover"
          />
          
          {allowReplacement && (
            <div className="absolute top-2 right-2 z-10">
              <Button
                variant="destructive"
                size="icon"
                className="h-6 w-6 rounded-full"
                onClick={handleRemoveFile}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      );
    }
    
    if (previewType === 'video') {
      return (
        <div className="relative aspect-video max-h-60 overflow-hidden rounded-md">
          <VideoPreview
            src={source}
            aspectRatio={previewAspectRatio as any}
            enableControls={true}
            className="h-full w-full object-cover"
          />
          
          {allowReplacement && (
            <div className="absolute top-2 right-2 z-10">
              <Button
                variant="destructive"
                size="icon"
                className="h-6 w-6 rounded-full"
                onClick={handleRemoveFile}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      );
    }
    
    // Otros tipos de archivo
    return (
      <div className="flex items-center p-4 bg-muted/50 rounded-md">
        <FileText className="h-8 w-8 mr-3 flex-shrink-0 text-muted-foreground" />
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{file?.name || "Archivo"}</p>
          {file && <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>}
        </div>
        
        {allowReplacement && (
          <Button
            variant="ghost"
            size="icon"
            className="ml-2 flex-shrink-0 h-8 w-8 text-destructive"
            onClick={handleRemoveFile}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg overflow-hidden transition-all duration-300",
          isDragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-border",
          (disabled || loading) && "opacity-60 cursor-not-allowed",
          error && "border-destructive",
          hasFile && showPreview ? "p-2" : "p-6",
          className
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !hasFile && triggerFileSelect()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled || loading}
        />
        
        {hasFile && showPreview ? (
          // Mostrar vista previa del archivo
          <div className="space-y-3">
            {renderPreview()}
            
            {file && (
              <div className="flex justify-between items-center px-2">
                <div className="text-xs text-muted-foreground truncate max-w-[70%]">
                  {file.name} ({formatFileSize(file.size)})
                </div>
                
                {actionLabel && onActionClick && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onActionClick();
                    }}
                    disabled={disabled || loading}
                  >
                    {actionIcon && <span className="mr-1.5">{actionIcon}</span>}
                    {actionLabel}
                  </Button>
                )}
              </div>
            )}
          </div>
        ) : (
          // Mostrar área de drop zone
          <div className="flex flex-col items-center justify-center text-center">
            <AnimatePresence>
              {isDragging ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex flex-col items-center py-3"
                >
                  <FileUp className="h-12 w-12 text-primary mb-2" />
                  <p className="text-sm font-medium text-primary">Suelta el archivo aquí</p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center"
                >
                  <div className="mb-3 rounded-full bg-primary/10 p-3">
                    <Upload className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-sm font-medium">{label}</p>
                  {sublabel && <p className="text-xs text-muted-foreground mt-1">{sublabel}</p>}
                  
                  {loading ? (
                    <div className="mt-2 flex items-center">
                      <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full mr-2" />
                      <span className="text-xs">Procesando...</span>
                    </div>
                  ) : (
                    fileTypeDescription && (
                      <p className="text-xs text-muted-foreground mt-3 max-w-xs">
                        {fileTypeDescription}
                      </p>
                    )
                  )}
                  
                  <div className="mt-4">{getFileIcon()}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
        
        {/* Overlay pulsante cuando está arrastrando */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-primary/5 pointer-events-none z-10"
            >
              <motion.div
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="absolute inset-0 border-2 border-primary rounded-lg"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Error message */}
      {error && (
        <p className="text-xs text-destructive mt-1">{error}</p>
      )}
      
      {/* Acciones */}
      {hasFile && allowReplacement && !showPreview && (
        <div className="flex justify-between items-center">
          <div className="text-sm truncate max-w-[70%]">
            {file?.name || "Archivo seleccionado"}
            {file && <span className="text-xs text-muted-foreground ml-1">({formatFileSize(file.size)})</span>}
          </div>
          
          <div className="flex items-center gap-2">
            {actionLabel && onActionClick && (
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={onActionClick}
                disabled={disabled || loading}
              >
                {actionIcon && <span className="mr-1.5">{actionIcon}</span>}
                {actionLabel}
              </Button>
            )}
            
            <Button
              variant="destructive"
              size="sm"
              className="h-8"
              onClick={handleRemoveFile}
              disabled={disabled || loading}
            >
              <X className="h-4 w-4 mr-1" />
              Quitar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}