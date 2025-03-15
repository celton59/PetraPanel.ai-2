import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { AlertCircle, Info, Video, ChevronDown, ChevronUp } from "lucide-react";
import { useVideoLimits } from "@/hooks/useVideoLimits";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Componente que muestra el límite de videos asignados para usuarios youtuber
 * Incluye un indicador de progreso y mensajes informativos
 */
export function VideoLimitsWidget() {
  const [expanded, setExpanded] = useState(false);
  const { 
    videoLimits, 
    isLoading, 
    usagePercentage, 
    isNearLimit, 
    isAtLimit 
  } = useVideoLimits();

  // Si está cargando, mostrar esqueleto
  if (isLoading) {
    return (
      <Card className="w-full shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-6 w-6 rounded-full" />
          </div>
          <Skeleton className="h-2 w-full mt-4" />
          <Skeleton className="h-10 w-3/4 mt-4" />
        </CardContent>
      </Card>
    );
  }

  // Determinar color según el porcentaje de uso
  let progressColor = "bg-green-500";
  let textColor = "text-green-600";
  let bgColor = "bg-green-50";
  let icon = <Info className="h-5 w-5 text-green-500" />;
  
  if (isAtLimit) {
    progressColor = "bg-red-500";
    textColor = "text-red-600";
    bgColor = "bg-red-50";
    icon = <AlertCircle className="h-5 w-5 text-red-500" />;
  } else if (isNearLimit) {
    progressColor = "bg-orange-500";
    textColor = "text-orange-600";
    bgColor = "bg-orange-50";
    icon = <AlertCircle className="h-5 w-5 text-orange-500" />;
  }

  return (
    <Card className={cn("w-full shadow-sm border", {
      "border-red-200": isAtLimit,
      "border-orange-200": !isAtLimit && isNearLimit,
      "border-gray-200": !isAtLimit && !isNearLimit
    })}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center mb-2">
              <Video className="h-4 w-4 mr-2 text-muted-foreground" />
              <h3 className="text-sm font-medium">Límite de videos asignados</h3>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 ml-1 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-xs">
                      Número de videos que tienes asignados actualmente vs. tu límite personal máximo.
                      Solo cuentan los videos en proceso, no los completados.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <div className="flex items-end mb-1.5">
              <span className={`text-xl font-bold ${textColor}`}>
                {videoLimits.currentCount}
              </span>
              <span className="text-sm text-muted-foreground mx-1">de</span>
              <span className="text-lg font-medium text-muted-foreground">
                {videoLimits.maxAllowed}
              </span>
            </div>
            
            <Progress 
              value={usagePercentage} 
              className={`h-2 ${progressColor}`} 
            />
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="p-1 h-8 w-8"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </Button>
        </div>
        
        {expanded && (
          <div className={`mt-4 p-3 rounded-md ${bgColor} flex items-start`}>
            {icon}
            <div className="ml-3">
              <p className={`text-sm ${textColor} font-medium`}>
                {isAtLimit 
                  ? "Has alcanzado tu límite de videos asignados" 
                  : isNearLimit 
                    ? "Estás cerca de tu límite de videos asignados" 
                    : "Tienes capacidad para más videos"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {isAtLimit 
                  ? "Completa algunos videos actuales antes de tomar nuevos." 
                  : isNearLimit 
                    ? `Puedes tomar ${videoLimits.maxAllowed - videoLimits.currentCount} videos más.` 
                    : "Tienes suficiente capacidad para tomar nuevos videos."}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}