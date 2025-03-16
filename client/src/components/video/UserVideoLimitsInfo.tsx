import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { InfoIcon } from "lucide-react";

interface UserVideoLimitsInfoProps {
  currentCount: number;
  maxAllowed: number;
}

/**
 * Componente que muestra información sobre los límites de videos asignados a un youtuber
 * Para usar en tablas de administración o paneles de control
 */
export function UserVideoLimitsInfo({ currentCount, maxAllowed }: UserVideoLimitsInfoProps) {
  // Calcular el porcentaje de uso
  const usagePercentage = Math.min(
    Math.round((currentCount / maxAllowed) * 100),
    100
  );

  // Determinar color según el porcentaje de uso
  let progressColor = "bg-green-500";
  let textColor = "text-green-600";
  
  if (usagePercentage > 90) {
    progressColor = "bg-red-500";
    textColor = "text-red-600";
  } else if (usagePercentage > 75) {
    progressColor = "bg-orange-500";
    textColor = "text-orange-600";
  } else if (usagePercentage > 50) {
    progressColor = "bg-yellow-500";
    textColor = "text-yellow-600";
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className={`text-sm font-medium ${textColor}`}>
          {currentCount} / {maxAllowed} videos
        </span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <InfoIcon className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Videos asignados actualmente vs. límite máximo</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <Progress value={usagePercentage} className={progressColor} />
      
      {usagePercentage >= 100 && (
        <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 text-xs">
          Límite alcanzado
        </Badge>
      )}
    </div>
  );
}