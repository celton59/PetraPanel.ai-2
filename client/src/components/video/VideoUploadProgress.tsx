import React from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { UploadProgressState } from "@/services/videoUploader";
import { BadgeCheck, Clock, FileVideo, Loader2, UploadCloud, X } from "lucide-react";

interface VideoUploadProgressProps {
  progressState: UploadProgressState;
  onCancel?: () => void;
  className?: string;
}

/**
 * Formatea un tamaño en bytes a una representación legible
 * @param bytes Tamaño en bytes
 * @returns Tamaño formateado con unidades
 */
function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Formatea un tiempo en segundos a una representación legible
 * @param seconds Tiempo en segundos
 * @returns Tiempo formateado como mm:ss o hh:mm:ss
 */
function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds) || !isFinite(seconds)) return '--:--';
  
  seconds = Math.round(seconds);
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}

export const VideoUploadProgress: React.FC<VideoUploadProgressProps> = ({ 
  progressState, 
  onCancel,
  className = "" 
}) => {
  const { isUploading, progress, uploadSpeed, estimatedTimeRemaining } = progressState;
  
  // Asegurar que el progreso esté entre 0 y 100
  const normalizedProgress = Math.min(100, Math.max(0, progress));
  
  // Determinar el estado del indicador
  const isComplete = normalizedProgress >= 100;
  const hasStarted = normalizedProgress > 0;
  
  return (
    <Card className={`p-4 ${className}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {isComplete ? (
              <BadgeCheck className="mr-2 h-5 w-5 text-green-500" />
            ) : isUploading ? (
              <UploadCloud className="mr-2 h-5 w-5 text-blue-500 animate-pulse" />
            ) : (
              <FileVideo className="mr-2 h-5 w-5 text-gray-500" />
            )}
            <span className="text-sm font-medium">
              {isComplete
                ? "Carga completada"
                : isUploading
                ? "Subiendo video..."
                : "Preparando carga"}
            </span>
          </div>
          
          {isUploading && !isComplete && onCancel && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0" 
              onClick={onCancel}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Cancelar</span>
            </Button>
          )}
        </div>
        
        <Progress value={normalizedProgress} className="h-2" />
        
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div className="flex items-center">
            <div className="flex items-center">
              {isUploading && !isComplete && (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              )}
              <span>
                Procesando...
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-end">
            <span>{Math.round(normalizedProgress)}%</span>
          </div>
          
          {hasStarted && (
            <>
              <div className="flex items-center">
                <span>{formatBytes(uploadSpeed)}/s</span>
              </div>
              
              <div className="flex items-center justify-end">
                <Clock className="mr-1 h-3 w-3" />
                <span>{formatTime(estimatedTimeRemaining)} restante</span>
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};