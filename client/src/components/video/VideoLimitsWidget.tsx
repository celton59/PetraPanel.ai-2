import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useVideoLimits } from "../../hooks/useVideoLimits";
import { Loader2, AlertCircle, Video, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useUser } from "../../hooks/use-user";

/**
 * Widget que muestra información sobre los límites de videos asignados a un youtuber
 * Solo se muestra para usuarios con rol "youtuber"
 */
export function VideoLimitsWidget() {
  const { user, isLoading: isUserLoading } = useUser();
  const { 
    data: limits,
    isLoading,
    isError,
    error
  } = useVideoLimits();

  // No mostrar nada si no es un youtuber o está cargando el usuario
  if (isUserLoading || user?.role !== "youtuber") {
    return null;
  }

  // Manejar estados de carga y error
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando límites de videos...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="w-full border-red-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2 text-red-500">
            <AlertCircle className="h-4 w-4" />
            Error al cargar límites
          </CardTitle>
          <CardDescription className="text-red-400">
            {error instanceof Error ? error.message : "Error desconocido"}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Si no hay datos, no mostrar nada
  if (!limits) {
    return null;
  }

  // Calcular el porcentaje de uso
  const usagePercentage = Math.min(
    Math.round((limits.currentCount / limits.maxAllowed) * 100),
    100
  );

  // Determinar color según el porcentaje de uso
  let progressColor = "bg-green-500";
  if (usagePercentage > 75) {
    progressColor = "bg-red-500";
  } else if (usagePercentage > 50) {
    progressColor = "bg-yellow-500";
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Video className="h-5 w-5" />
          Estado de asignación de videos
        </CardTitle>
        <CardDescription>
          Tienes {limits.currentCount} de {limits.maxAllowed} videos asignados
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Progress value={usagePercentage} className={progressColor} />
          
          <div className="flex flex-wrap gap-2">
            {limits.canTakeMore ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Check className="h-3 w-3 mr-1" />
                Puedes tomar más videos
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                <AlertCircle className="h-3 w-3 mr-1" />
                Límite alcanzado
              </Badge>
            )}
            
            <Badge variant="outline">
              {limits.maxAllowed} máximo
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}