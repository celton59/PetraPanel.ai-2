import React, { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { UploadProgressState } from "@/services/videoUploader";
import { BadgeCheck, Clock, FileVideo, Loader2, UploadCloud, X } from "lucide-react";
import { cn } from "@/lib/utils";

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
  
  // Estado para la animación de progreso simulado
  const [simulatedProgress, setSimulatedProgress] = useState<number>(progress);
  const lastProgressRef = useRef<number>(progress);
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Efecto para manejar la simulación de progreso cuando la carga real se detiene
  useEffect(() => {
    // Si el progreso real cambió, actualizar la simulación
    if (progress !== lastProgressRef.current) {
      lastProgressRef.current = progress;
      setSimulatedProgress(progress);
      
      // Limpiar cualquier intervalo existente
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
        simulationIntervalRef.current = null;
      }
    }
    
    // Si la carga está activa pero el progreso no ha cambiado en un tiempo
    // y está por debajo del 98%, simulamos un avance gradual con más realismo
    if (isUploading && progress < 98 && !isComplete) {
      if (!simulationIntervalRef.current) {
        // Añadimos pequeñas variaciones aleatorias para que parezca más realista
        const getRandomIncrement = () => {
          // Base del incremento (entre 0.1 y 0.3)
          const baseIncrement = 0.1 + Math.random() * 0.2;
          
          // A veces añadimos un pequeño "salto" para simular un progreso más realista
          // 10% de probabilidad de un salto pequeño
          if (Math.random() < 0.1) {
            return baseIncrement + Math.random() * 0.7;
          }
          
          return baseIncrement;
        };
        
        simulationIntervalRef.current = setInterval(() => {
          setSimulatedProgress(prev => {
            // Si el progreso real es mayor, usamos ese
            if (progress > prev) return progress;
            
            // Calculamos un incremento que sea más lento a medida que se acerca al límite
            const remaining = 98 - prev;
            
            // Si queda muy poco, hacemos incrementos más pequeños
            if (remaining < 5) {
              return Math.min(97.5, prev + Math.random() * 0.05);
            }
            
            // Incremento normal con variación aleatoria
            const increment = Math.max(0.05, remaining * 0.01) * getRandomIncrement();
            
            // Aseguramos que no pase del 98% para evitar falsas expectativas
            return Math.min(97.5, prev + increment);
          });
        }, 300 + Math.random() * 200); // Intervalo variable entre 300-500ms para más realismo
      }
    }
    
    // Limpieza al desmontar
    return () => {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
    };
  }, [isUploading, progress]);
  
  // Asegurar que el progreso esté entre 0 y 100
  const normalizedProgress = Math.min(100, Math.max(0, isUploading ? simulatedProgress : progress));
  
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
        
        <div className="relative mb-1">
          <Progress value={normalizedProgress} className={cn("h-2.5 transition-all", {
            "bg-gradient-to-r from-blue-400 to-blue-500": isUploading && !isComplete,
            "bg-gradient-to-r from-green-400 to-green-500": isComplete
          })} />
          
          {/* Animación de "pulso" en la barra de progreso cuando está procesando */}
          {isUploading && !isComplete && normalizedProgress > 0 && normalizedProgress < 98 && (
            <div className="absolute top-0 left-0 h-full w-full overflow-hidden">
              <div className="absolute top-0 h-full bg-white/10 animate-pulse-wave" 
                  style={{
                    width: `${Math.min(100, normalizedProgress + 5)}%`,
                    animationDuration: "1.5s"
                  }} />
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div className="flex items-center">
            <div className="flex items-center">
              {isUploading && !isComplete && (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin text-primary" />
              )}
              <span className={cn("font-medium", {
                "text-primary": isUploading && !isComplete,
                "text-green-500": isComplete
              })}>
                {isComplete 
                  ? "Completado" 
                  : progress === 0 && isUploading 
                    ? "Iniciando..." 
                    : progress > 0 && progress < 20 
                      ? "Enviando datos..." 
                      : progress >= 20 && progress < 80 
                        ? "Procesando video..." 
                        : "Finalizando..."}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-end">
            <span className="font-medium">{Math.round(normalizedProgress)}%</span>
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