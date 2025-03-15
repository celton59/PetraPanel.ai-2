import { useVideoLimits } from "@/hooks/useVideoLimits";
import { Badge } from "@/components/ui/badge";
import { Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Componente de badge sutil que muestra el límite de videos asignados
 * Diseñado para colocarse junto a los filtros
 */
export function VideoLimitsBadge() {
  const { videoLimits, isLoading, usagePercentage, isNearLimit, isAtLimit } = useVideoLimits();

  if (isLoading) {
    return null;
  }

  // Determinar colores según el estado
  const getBadgeStyle = () => {
    if (isAtLimit) {
      return "bg-red-100 text-red-800 hover:bg-red-200";
    } else if (isNearLimit) {
      return "bg-amber-100 text-amber-800 hover:bg-amber-200";
    } else if (usagePercentage > 40) {
      return "bg-blue-100 text-blue-800 hover:bg-blue-200";
    } else {
      return "bg-emerald-100 text-emerald-800 hover:bg-emerald-200";
    }
  };

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <Button
            variant="outline" 
            size="sm"
            className={cn("gap-1.5 border-none font-medium", getBadgeStyle())}
          >
            <Video className="h-3.5 w-3.5" />
            <span>{videoLimits.currentCount}/{videoLimits.maxAllowed}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent className="p-3 max-w-xs">
          <div className="space-y-2">
            <p className="text-sm font-medium">
              Límite de videos asignados
            </p>
            <p className="text-xs text-muted-foreground">
              Estás utilizando {videoLimits.currentCount} de tus {videoLimits.maxAllowed} videos disponibles
              {isAtLimit 
                ? ". Has alcanzado tu límite máximo."
                : isNearLimit
                  ? `. Estás cerca de tu límite (${usagePercentage}%).`
                  : `.`
              }
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}