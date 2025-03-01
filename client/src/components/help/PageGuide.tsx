import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";

type GuideStep = {
  title: string;
  description: string;
  image?: string;
}

type RouteGuides = {
  [key: string]: {
    title: string;
    steps: GuideStep[];
  }
}

const routeGuides: RouteGuides = {
  "/": {
    title: "Panel de Control",
    steps: [
      {
        title: "Dashboard Principal",
        description: "Aquí encontrarás un resumen de la actividad reciente, estadísticas clave y accesos rápidos a las funciones más utilizadas."
      },
      {
        title: "Acciones Rápidas",
        description: "Estas tarjetas te permiten realizar acciones comunes como crear un nuevo video, iniciar una traducción o revisar contenido pendiente."
      },
      {
        title: "Estadísticas",
        description: "Visualiza métricas importantes como videos procesados, optimizaciones realizadas y actividad del equipo."
      }
    ]
  },
  "/videos": {
    title: "Gestión de Videos",
    steps: [
      {
        title: "Biblioteca de Videos",
        description: "Aquí puedes ver, filtrar y gestionar todos tus videos. Usa los filtros superiores para encontrar contenido específico."
      },
      {
        title: "Estados de los Videos",
        description: "Cada video tiene un estado que indica su progreso en el flujo de trabajo. Los colores te ayudan a identificar rápidamente su situación."
      },
      {
        title: "Acciones Disponibles",
        description: "Selecciona un video para ver detalles y realizar acciones como editar, eliminar o avanzar en el flujo de trabajo."
      }
    ]
  },
  "/traductor": {
    title: "Traductor de Videos",
    steps: [
      {
        title: "Herramienta de Traducción",
        description: "Esta herramienta te permite separar el audio, transcribir y traducir videos a diferentes idiomas automáticamente."
      },
      {
        title: "Proceso Paso a Paso",
        description: "Sigue el proceso guiado para extraer el audio, separar voces, transcribir y finalmente traducir y sincronizar el contenido."
      },
      {
        title: "Resultados de Traducción",
        description: "Después de procesar, podrás previsualizar y descargar el video traducido junto con los subtítulos generados."
      }
    ]
  },
  "/estadisticas": {
    title: "Análisis y Estadísticas",
    steps: [
      {
        title: "Métricas Globales",
        description: "Visualiza el rendimiento general con gráficos de actividad, eficiencia y métricas clave del sistema."
      },
      {
        title: "Rendimiento por Usuario",
        description: "Analiza la productividad individual de cada miembro del equipo y su contribución a los proyectos."
      },
      {
        title: "Reportes Personalizados",
        description: "Utiliza los filtros para generar informes específicos y exportarlos para su análisis posterior."
      }
    ]
  },
  "/perfil": {
    title: "Tu Perfil",
    steps: [
      {
        title: "Información Personal",
        description: "Aquí puedes ver y actualizar tus datos personales, cambiar tu avatar y gestionar tu información de contacto."
      },
      {
        title: "Seguridad",
        description: "Actualiza tu contraseña y gestiona las opciones de seguridad de tu cuenta."
      },
      {
        title: "Preferencias",
        description: "Configura tus preferencias de notificaciones y personaliza tu experiencia en la plataforma."
      }
    ]
  },
  "/ajustes": {
    title: "Configuración del Sistema",
    steps: [
      {
        title: "Gestión de Usuarios",
        description: "Administra usuarios, asigna roles y gestiona permisos para tu equipo."
      },
      {
        title: "Flujos de Trabajo",
        description: "Configura y personaliza los flujos de trabajo para adaptarlos a tus necesidades."
      },
      {
        title: "Proyectos",
        description: "Crea y gestiona proyectos, asigna usuarios y configura ajustes específicos para cada uno."
      }
    ]
  }
};

export function PageGuide() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  // Encuentra la guía para la ruta actual
  const currentPathBase = '/' + location.split('/')[1]; // Obtiene la ruta base
  const currentGuide = routeGuides[currentPathBase] || routeGuides["/"];
  
  // Verifica si este es el primer acceso a esta página
  useEffect(() => {
    const visitedPages = JSON.parse(localStorage.getItem('visitedPages') || '{}');
    if (!visitedPages[currentPathBase]) {
      setOpen(true);
      // Marca la página como visitada
      visitedPages[currentPathBase] = true;
      localStorage.setItem('visitedPages', JSON.stringify(visitedPages));
    }
  }, [currentPathBase]);
  
  // Reinicia el paso actual cuando cambia la ruta
  useEffect(() => {
    setCurrentStep(0);
  }, [location]);
  
  const totalSteps = currentGuide.steps.length;
  const currentStepData = currentGuide.steps[currentStep];
  
  function nextStep() {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setOpen(false);
    }
  }
  
  function prevStep() {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }
  
  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {currentGuide.title} - {currentStepData.title}
            </DialogTitle>
            <DialogDescription>
              Paso {currentStep + 1} de {totalSteps}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {currentStepData.image && (
              <div className="mb-4 rounded-md overflow-hidden border">
                <img 
                  src={currentStepData.image} 
                  alt={currentStepData.title} 
                  className="w-full h-auto object-cover"
                />
              </div>
            )}
            
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {currentStepData.description}
            </p>
          </div>
          
          <DialogFooter className="flex justify-between sm:justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                size="sm"
              >
                Cerrar
              </Button>
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
                size="sm"
              >
                Anterior
              </Button>
            </div>
            
            <Button 
              onClick={nextStep}
              size="sm"
            >
              {currentStep < totalSteps - 1 ? "Siguiente" : "Finalizar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}