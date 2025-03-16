import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  AlertCircle, 
  Info, 
  Video, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  PlayCircle,
  MonitorPlay,
  Sparkles
} from "lucide-react";
import { useVideoLimits } from "@/hooks/useVideoLimits";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Componente mejorado que muestra el límite de videos asignados para usuarios youtuber
 * Incluye visualización gráfica moderna, animaciones y mensajes contextuales
 */
export function VideoLimitsWidget() {
  const [expanded, setExpanded] = useState(false);
  const [animate, setAnimate] = useState(false);
  const { 
    videoLimits, 
    isLoading, 
    usagePercentage, 
    isNearLimit, 
    isAtLimit 
  } = useVideoLimits();

  // Trigger animation when component mounts
  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // Si está cargando, mostrar esqueleto con animación de pulso
  if (isLoading) {
    return (
      <Card className="w-full shadow-md border border-gray-200/50">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-full animate-pulse" />
              <Skeleton className="h-6 w-52" />
            </div>
            <Skeleton className="h-6 w-6 rounded-full" />
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-6 w-16" />
            </div>
            <Skeleton className="h-3 w-full rounded-full" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Determinar tema según el porcentaje de uso
  const theme = {
    low: {
      progressColor: "bg-emerald-500",
      textColor: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      icon: <Sparkles className="h-5 w-5 text-emerald-500" />,
      gradientFrom: "from-emerald-400",
      gradientTo: "to-emerald-600",
      iconBg: "bg-emerald-100",
      statusIcon: <Check className="h-5 w-5 text-emerald-500" />
    },
    medium: {
      progressColor: "bg-blue-500",
      textColor: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      icon: <TrendingUp className="h-5 w-5 text-blue-500" />,
      gradientFrom: "from-blue-400",
      gradientTo: "to-blue-600",
      iconBg: "bg-blue-100",
      statusIcon: <Clock className="h-5 w-5 text-blue-500" />
    },
    high: {
      progressColor: "bg-amber-500",
      textColor: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
      gradientFrom: "from-amber-400",
      gradientTo: "to-amber-600",
      iconBg: "bg-amber-100",
      statusIcon: <AlertTriangle className="h-5 w-5 text-amber-500" />
    },
    critical: {
      progressColor: "bg-red-500",
      textColor: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      gradientFrom: "from-red-400",
      gradientTo: "to-red-600",
      iconBg: "bg-red-100",
      statusIcon: <AlertCircle className="h-5 w-5 text-red-500" />
    }
  };

  // Seleccionar tema basado en el uso
  let currentTheme;
  if (isAtLimit) {
    currentTheme = theme.critical;
  } else if (isNearLimit) {
    currentTheme = theme.high;
  } else if (usagePercentage > 40) {
    currentTheme = theme.medium;
  } else {
    currentTheme = theme.low;
  }

  // Función para renderizar los círculos que representan videos
  const renderVideoCircles = () => {
    const totalCircles = videoLimits.maxAllowed;
    const filledCircles = videoLimits.currentCount;
    
    return (
      <div className="flex flex-wrap gap-1.5 mt-3 mb-1">
        {Array.from({ length: totalCircles }).map((_, index) => {
          const isFilled = index < filledCircles;
          return (
            <motion.div
              key={index}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: isFilled ? 1 : 0.85, 
                opacity: 1 
              }}
              transition={{ 
                delay: index * 0.02, 
                duration: 0.3,
                type: "spring",
                stiffness: 200
              }}
              className={cn(
                "w-4 h-4 rounded-full flex items-center justify-center",
                isFilled 
                  ? `${currentTheme.iconBg} ${currentTheme.textColor} shadow-sm` 
                  : "bg-gray-100 text-gray-400"
              )}
            >
              {isFilled ? (
                <PlayCircle className="w-3 h-3" />
              ) : (
                <MonitorPlay className="w-2.5 h-2.5" />
              )}
            </motion.div>
          );
        })}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, type: "spring" }}
    >
      <Card className={cn("w-full shadow-md border overflow-hidden", currentTheme.borderColor)}>
        {/* Header gradient accent */}
        <div className={`h-1 w-full bg-gradient-to-r ${currentTheme.gradientFrom} ${currentTheme.gradientTo}`}></div>
        
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Header */}
              <div className="flex items-center gap-2 mb-3">
                <div className={`rounded-full p-1.5 ${currentTheme.iconBg}`}>
                  <Video className={`h-5 w-5 ${currentTheme.textColor}`} />
                </div>
                <div>
                  <h3 className="text-base font-semibold">Límite de videos asignados</h3>
                  <p className="text-xs text-muted-foreground">Gestión de capacidad de trabajo</p>
                </div>
                <TooltipProvider>
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 ml-1 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs">
                      <p className="text-xs">
                        Este indicador muestra los videos asignados actualmente vs. tu límite personalizado.
                        Solo se contabilizan los videos en proceso, no los completados.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              {/* Main content */}
              <div className="space-y-4">
                {/* Numerical indicator */}
                <div className="flex items-baseline justify-between">
                  <div className="flex items-baseline">
                    <motion.span 
                      className={`text-3xl font-bold ${currentTheme.textColor}`}
                      key={videoLimits.currentCount}
                      initial={{ y: -10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      {videoLimits.currentCount}
                    </motion.span>
                    <span className="text-sm text-muted-foreground mx-1.5 font-medium">de</span>
                    <span className="text-xl font-medium text-muted-foreground">
                      {videoLimits.maxAllowed}
                    </span>
                  </div>
                  
                  <div className={`px-2.5 py-1 rounded-md ${currentTheme.bgColor} flex items-center gap-1.5`}>
                    {currentTheme.statusIcon}
                    <span className={`text-xs font-medium ${currentTheme.textColor}`}>
                      {isAtLimit 
                        ? "En límite" 
                        : isNearLimit 
                          ? "Casi lleno" 
                          : usagePercentage > 40 
                            ? "Moderado" 
                            : "Disponible"}
                    </span>
                  </div>
                </div>
                
                {/* Progress bar with custom marker */}
                <div className="relative w-full">
                  <Progress 
                    value={usagePercentage} 
                    className={`h-2.5 ${currentTheme.progressColor}`} 
                  />
                  <motion.div 
                    className={`absolute top-0 h-2.5 w-1.5 bg-white border-l border-r ${currentTheme.borderColor}`}
                    style={{ left: `${Math.min(usagePercentage, 98)}%` }}
                    initial={{ height: "0.4rem" }}
                    animate={{ height: "0.7rem", top: "-0.1rem" }}
                    transition={{ 
                      repeat: Infinity, 
                      repeatType: "reverse", 
                      duration: 1.5 
                    }}
                  />
                </div>
                
                {/* Visual representation */}
                {renderVideoCircles()}
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              className="p-1 h-8 w-8 ml-2"
              onClick={() => setExpanded(!expanded)}
              aria-label={expanded ? "Contraer detalles" : "Expandir detalles"}
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </Button>
          </div>
          
          {/* Expanded details */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className={`mt-5 p-4 rounded-lg ${currentTheme.bgColor} flex items-start`}>
                  {currentTheme.icon}
                  <div className="ml-3">
                    <p className={`text-sm ${currentTheme.textColor} font-medium`}>
                      {isAtLimit 
                        ? "Has alcanzado tu límite máximo de videos" 
                        : isNearLimit 
                          ? "Estás acercándote al límite de tu capacidad" 
                          : usagePercentage > 40
                            ? "Tienes una carga de trabajo moderada"
                            : "Tienes buena capacidad para nuevos videos"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {isAtLimit 
                        ? "Para tomar nuevos videos, primero debes completar algunos de los que ya tienes asignados. Esto garantiza un flujo de trabajo equilibrado y de alta calidad." 
                        : isNearLimit 
                          ? `Puedes tomar ${videoLimits.maxAllowed - videoLimits.currentCount} videos más. Considera finalizar algunos de tus videos actuales antes de aceptar demasiados nuevos.` 
                          : usagePercentage > 40
                            ? `Estás utilizando el ${usagePercentage}% de tu capacidad. Aún puedes tomar ${videoLimits.maxAllowed - videoLimits.currentCount} videos adicionales sin sobrecargarte.`
                            : `¡Excelente! Tienes disponible el ${100 - usagePercentage}% de tu capacidad, equivalente a ${videoLimits.maxAllowed - videoLimits.currentCount} videos adicionales que puedes asumir.`}
                    </p>
                    <div className="mt-3 text-xs text-muted-foreground border-t border-muted/20 pt-2">
                      <span className="block">
                        Tu límite personal es de <span className="font-medium">{videoLimits.maxAllowed} videos</span>. 
                        Este límite está personalizado según tu capacidad y rendimiento.
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}