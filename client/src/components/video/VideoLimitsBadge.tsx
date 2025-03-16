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
  const { videoLimits, isLoading } = useVideoLimits();

  // Siempre mostrar el badge, incluso durante la carga,
  // para evitar saltos en la interfaz
  const count = isLoading ? 0 : videoLimits.currentCount;
  const max = isLoading ? 30 : videoLimits.maxAllowed;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <Button
            variant="ghost" 
            size="sm"
            className="gap-1.5 font-medium"
          >
            <Video className="h-3.5 w-3.5" />
            <span>{count}/{max}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent className="p-3 max-w-xs">
          <div className="space-y-2">
            <p className="text-sm font-medium">
              Límite de videos asignados
            </p>
            <p className="text-xs text-muted-foreground">
              Estás utilizando {count} de tus {max} videos disponibles.
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}