import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { ApiVideo } from "@/hooks/useVideos";

interface VideoUploadFieldsProps {
  videoFile: File | null;
  thumbnailFile: File | null;
  onVideoFileChange: (file: File | null) => void;
  onThumbnailFileChange: (file: File | null) => void;
  isUploading?: boolean;
  uploadProgress?: number;
  video: ApiVideo
}

export function VideoUploadFields({
  videoFile,
  thumbnailFile,
  onVideoFileChange,
  onThumbnailFileChange,
  isUploading,
  uploadProgress = 0,
  video
}: VideoUploadFieldsProps) {
  const [isDraggingVideo, setIsDraggingVideo] = useState(false);
  const [isDraggingThumbnail, setIsDraggingThumbnail] = useState(false);

  function handleDragOver(e: React.DragEvent, setIsDragging: (value: boolean) => void) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent, setIsDragging: (value: boolean) => void) {
    e.preventDefault();
    setIsDragging(false);
  }

  async function handleDrop(
    e: React.DragEvent,
    setIsDragging: (value: boolean) => void,
    setFile: (file: File | null) => void,
    fileType: "video" | "image",
  ) {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (!file) return;

    if (fileType === "video" && !file.type.startsWith("video/")) {
      alert("Por favor, sube un archivo de video válido");
      return;
    }

    if (fileType === "image" && !file.type.startsWith("image/")) {
      alert("Por favor, sube un archivo de imagen válido");
      return;
    }

    setFile(file);
  }

  function FileUploadZone({
    file,
    isDragging,
    onDragOver,
    onDragLeave,
    onDrop,
    onFileChange,
    accept,
    type,
    isUploading,
    uploadProgress,
  }: {
    file: File | null;
    isDragging: boolean;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
    onFileChange: (file: File | null) => void;
    accept: string;
    type: "video" | "image";
    isUploading?: boolean;
    uploadProgress?: number;
  }) {
    return (
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`
          relative border border-dashed rounded-md p-4 text-center
          ${type === "video" 
            ? isDragging ? "border-blue-400 bg-blue-50/30 dark:border-blue-500 dark:bg-blue-900/10" : "border-blue-200 dark:border-blue-800/50" 
            : isDragging ? "border-purple-400 bg-purple-50/30 dark:border-purple-500 dark:bg-purple-900/10" : "border-purple-200 dark:border-purple-800/50"
          }
          ${isUploading ? "bg-muted/20" : ""}
          transition-colors
        `}
      >
        <input
          type="file"
          accept={accept}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFileChange(file);
          }}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading}
        />
  
        {file ? (
          <div className="space-y-1">
            <p className="text-xs font-medium">Archivo seleccionado:</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-full">{file.name}</p>
            {isUploading && <Progress value={uploadProgress} className="h-1 mt-1" />}
          </div>
        ) : (
          <div className="space-y-1 py-1">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {type === "video" ? "Arrastra tu video aquí" : "Arrastra tu imagen aquí"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              O haz clic para seleccionar
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Layout de 2 columnas para actual y nuevo */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Columna 1: Contenido de video */}
        <div className="space-y-4">
          {/* Video Actual */}
          {video.videoUrl && (
            <div className="overflow-hidden rounded-md border border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-900/40 dark:to-gray-900/20 px-3 py-2 border-b border-gray-200 dark:border-gray-800">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Video Actual</h3>
              </div>
              <div className="p-2">
                <video controls className="w-full h-auto rounded overflow-hidden max-h-[180px]">
                  <source src={video.videoUrl} type="video/mp4" />
                  Tu navegador no soporta la visualización del video.
                </video>
              </div>
            </div>
          )}

          {/* Nuevo Video */}
          <div className="overflow-hidden rounded-md border border-blue-200 dark:border-blue-800/50 shadow-sm">
            <div className="bg-gradient-to-r from-blue-50 to-white dark:from-blue-950/20 dark:to-gray-900/20 px-3 py-2 border-b border-blue-200 dark:border-blue-800/50">
              <h3 className="text-sm font-medium text-blue-700 dark:text-blue-300">Nuevo Video</h3>
            </div>
            <div className="p-3">
              <FileUploadZone
                file={videoFile}
                isDragging={isDraggingVideo}
                onDragOver={(e) => handleDragOver(e, setIsDraggingVideo)}
                onDragLeave={(e) => handleDragLeave(e, setIsDraggingVideo)}
                onDrop={(e) => handleDrop(e, setIsDraggingVideo, onVideoFileChange, "video")}
                onFileChange={onVideoFileChange}
                accept="video/*"
                type="video"
                isUploading={isUploading}
                uploadProgress={uploadProgress}
              />
              {!videoFile && (
                <div className="flex items-center p-2.5 mt-3 rounded-md border border-gray-100 dark:border-gray-800 bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/30 dark:to-gray-900/10 text-xs text-gray-600 dark:text-gray-400">
                  <AlertCircle className="h-3.5 w-3.5 mr-2 text-blue-500 dark:text-blue-400 flex-shrink-0" />
                  <div>
                    <span className="font-medium block mb-0.5 text-blue-700 dark:text-blue-300">Formatos:</span>
                    <span>MP4, MOV, AVI. Tamaño máximo: 1GB</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Columna 2: Contenido de miniatura */}
        <div className="space-y-4">
          {/* Miniatura Actual */}
          {video.thumbnailUrl && (
            <div className="overflow-hidden rounded-md border border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-900/40 dark:to-gray-900/20 px-3 py-2 border-b border-gray-200 dark:border-gray-800">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Miniatura Actual</h3>
              </div>
              <div className="p-3">
                <img 
                  src={video.thumbnailUrl} 
                  alt="Miniatura actual"
                  className="w-full h-auto rounded overflow-hidden object-cover max-h-[220px]" 
                />
              </div>
            </div>
          )}
          
          {/* Nueva Miniatura */}
          <div className="overflow-hidden rounded-md border border-purple-200 dark:border-purple-800/50 shadow-sm">
            <div className="bg-gradient-to-r from-purple-50 to-white dark:from-purple-950/20 dark:to-gray-900/20 px-3 py-2 border-b border-purple-200 dark:border-purple-800/50">
              <h3 className="text-sm font-medium text-purple-700 dark:text-purple-300">Nueva Miniatura</h3>
            </div>
            <div className="p-3">
              <FileUploadZone
                file={thumbnailFile}
                isDragging={isDraggingThumbnail}
                onDragOver={(e) => handleDragOver(e, setIsDraggingThumbnail)}
                onDragLeave={(e) => handleDragLeave(e, setIsDraggingThumbnail)}
                onDrop={(e) => handleDrop(e, setIsDraggingThumbnail, onThumbnailFileChange, "image")}
                onFileChange={onThumbnailFileChange}
                accept="image/*"
                type="image"
                isUploading={isUploading}
                uploadProgress={uploadProgress}
              />
              {!thumbnailFile && (
                <div className="flex items-center p-2.5 mt-3 rounded-md border border-gray-100 dark:border-gray-800 bg-gradient-to-r from-purple-50 to-transparent dark:from-purple-900/30 dark:to-gray-900/10 text-xs text-gray-600 dark:text-gray-400">
                  <AlertCircle className="h-3.5 w-3.5 mr-2 text-purple-500 dark:text-purple-400 flex-shrink-0" />
                  <div>
                    <span className="font-medium block mb-0.5 text-purple-700 dark:text-purple-300">Especificaciones:</span>
                    <span>JPG, PNG. Resolución recomendada: 1280x720</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
