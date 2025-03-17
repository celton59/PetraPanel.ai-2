import { useVideoLimits } from "@/hooks/useVideoLimits";
import { Badge } from "@/components/ui/badge";
import { Video, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Componente de badge sutil que muestra el límite de videos asignados y mensuales
 * Diseñado para colocarse junto a los filtros
 */
export function VideoLimitsBadge() {
  const { videoLimits, isLoading } = useVideoLimits();

  // Siempre mostrar el badge, incluso durante la carga,
  // para evitar saltos en la interfaz
  const count = isLoading ? 0 : videoLimits.currentAssignedCount;
  const max = isLoading ? 10 : videoLimits.maxAssignedAllowed;
  
  // Datos de límites mensuales
  const monthlyCount = isLoading ? 0 : videoLimits.currentMonthlyCount;
  const monthlyMax = isLoading ? 50 : videoLimits.monthlyLimit;

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
        <TooltipContent className="p-4 max-w-xs">
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Video className="h-3.5 w-3.5 text-primary" />
                <p className="text-sm font-medium">
                  Videos asignados actualmente
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Estás utilizando <strong>{count}</strong> de tus <strong>{max}</strong> videos disponibles.
                {count >= max ? (
                  <span className="block mt-1 text-red-500 font-medium">
                    Has alcanzado tu límite máximo de asignación.
                  </span>
                ) : null}
              </p>
            </div>
            
            <div className="border-t pt-2">
              <div className="flex items-center gap-1.5 mb-1">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                <p className="text-sm font-medium">
                  Videos mensuales completados
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Has completado <strong>{monthlyCount}</strong> de un máximo de <strong>{monthlyMax}</strong> videos este mes.
                {monthlyCount >= monthlyMax ? (
                  <span className="block mt-1 text-red-500 font-medium">
                    Has alcanzado tu límite mensual.
                  </span>
                ) : null}
              </p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}