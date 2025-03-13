import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImprovedTrainingExamplesDialog } from "@/pages/titulin/configuration/ImprovedTrainingExamplesDialog";
import { TitleComparisonDialog } from "@/pages/titulin/configuration/TitleComparisonDialog";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, BarChart2, Brain, Database, RefreshCw } from "lucide-react";

/**
 * Componente para configuración de Titulín
 * @returns JSX.Element
 */
export default function TitulinTab() {
  const { toast } = useToast();
  const [trainingExamplesOpen, setTrainingExamplesOpen] = useState(false);
  const [titleComparisonOpen, setTitleComparisonOpen] = useState(false);
  const [cleaningInProgress, setCleaningInProgress] = useState(false);
  
  /**
   * Limpia los videos sin canal asignado
   */
  const handleCleanOrphans = async () => {
    setCleaningInProgress(true);
    try {
      const response = await fetch(`/api/titulin/clean-orphans`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Limpieza completada",
          description: `Se eliminaron ${data.deletedCount} videos huérfanos.`,
          variant: "default",
        });
      } else {
        toast({
          title: "Error al limpiar videos",
          description: data.message || "No se pudieron eliminar los videos huérfanos.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error al conectar con el servidor.",
        variant: "destructive",
      });
    } finally {
      setCleaningInProgress(false);
    }
  };

  return (
    <div className="space-y-6">
      <Alert variant="default" className="bg-blue-50 border-blue-200 mb-6">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-800">Configuración de Titulín</AlertTitle>
        <AlertDescription className="text-blue-700">
          En esta sección puedes gestionar la configuración del sistema de análisis de títulos Titulín.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Entrenamiento
            </CardTitle>
            <CardDescription>
              Gestiona ejemplos de entrenamiento para el algoritmo de análisis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setTrainingExamplesOpen(true)}
              className="w-full"
            >
              Gestionar ejemplos
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-primary" />
              Comparación de títulos
            </CardTitle>
            <CardDescription>
              Compara títulos con los existentes para evitar repeticiones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setTitleComparisonOpen(true)}
              className="w-full"
            >
              Abrir comparador
            </Button>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-6" />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Mantenimiento
          </CardTitle>
          <CardDescription>
            Operaciones de mantenimiento para el sistema Titulín
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Button 
              onClick={handleCleanOrphans}
              variant="outline"
              className="w-full"
              disabled={cleaningInProgress}
            >
              {cleaningInProgress ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Limpiando...
                </>
              ) : (
                "Limpiar videos sin canal"
              )}
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              Elimina videos que no tienen un canal asociado en la base de datos.
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Diálogos */}
      <ImprovedTrainingExamplesDialog 
        open={trainingExamplesOpen} 
        onOpenChange={setTrainingExamplesOpen} 
      />
      <TitleComparisonDialog 
        open={titleComparisonOpen} 
        onOpenChange={setTitleComparisonOpen}
      />
    </div>
  );
}