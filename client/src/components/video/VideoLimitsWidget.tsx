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
  Sparkles,
  Calendar,
  CalendarCheck,
  Star,
  ListTodo
} from "lucide-react";
import { useVideoLimits } from "@/hooks/useVideoLimits";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * Componente mejorado que muestra el límite de videos asignados para usuarios youtuber
 * Incluye visualización gráfica moderna, animaciones y mensajes contextuales
 * Ahora con soporte para información de límites mensuales
 */
export function VideoLimitsWidget() {
  const [expanded, setExpanded] = useState(false);
  const [animate, setAnimate] = useState(false);
  const { 
    videoLimits, 
    isLoading, 
    usagePercentage, 
    isNearLimit, 
    isAtLimit,
    // Nuevos datos para límites mensuales
    monthlyUsagePercentage,
    isNearMonthlyLimit,
    isAtMonthlyLimit
  } = useVideoLimits();
  
  // Verificar si hay un límite mensual específico para este mes
  const hasSpecificLimit = !isLoading && videoLimits.specificMonthlyLimit === true;

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
    const totalCircles = videoLimits.maxAssignedAllowed;
    const filledCircles = videoLimits.currentAssignedCount;
    
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

  // Determinar tema para límites mensuales
  let monthlyTheme;
  if (isAtMonthlyLimit) {
    monthlyTheme = theme.critical;
  } else if (isNearMonthlyLimit) {
    monthlyTheme = theme.high;
  } else if (monthlyUsagePercentage > 40) {
    monthlyTheme = theme.medium;
  } else {
    monthlyTheme = theme.low;
  }

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
                  <h3 className="text-base font-semibold">Límites de videos</h3>
                  <p className="text-xs text-muted-foreground">Gestión de capacidad de trabajo</p>
                </div>
                <TooltipProvider>
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 ml-1 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs">
                      <p className="text-xs">
                        Este panel muestra tus límites de videos asignados actualmente y 
                        videos completados este mes según tus límites personalizados.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              {/* Tabs para alternar entre límites concurrentes y mensuales */}
              <Tabs defaultValue="concurrentes" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="concurrentes" className="text-xs">
                    <Video className="w-3.5 h-3.5 mr-1.5" />
                    Asignados
                  </TabsTrigger>
                  <TabsTrigger value="mensuales" className="text-xs">
                    <Calendar className="w-3.5 h-3.5 mr-1.5" />
                    Mensuales
                  </TabsTrigger>
                </TabsList>
                
                {/* Tab de límites concurrentes */}
                <TabsContent value="concurrentes" className="space-y-4 mt-2">
                  {/* Numerical indicator */}
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline">
                      <motion.span 
                        className={`text-3xl font-bold ${currentTheme.textColor}`}
                        key={videoLimits.currentAssignedCount}
                        initial={{ y: -10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        {videoLimits.currentAssignedCount}
                      </motion.span>
                      <span className="text-sm text-muted-foreground mx-1.5 font-medium">de</span>
                      <span className="text-xl font-medium text-muted-foreground">
                        {videoLimits.maxAssignedAllowed}
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
                </TabsContent>

                {/* Tab de límites mensuales */}
                <TabsContent value="mensuales" className="space-y-4 mt-2">
                  {/* Numerical indicator para límites mensuales */}
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline">
                      <motion.span 
                        className={`text-3xl font-bold ${monthlyTheme.textColor}`}
                        key={videoLimits.currentMonthlyCount}
                        initial={{ y: -10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        {videoLimits.currentMonthlyCount}
                      </motion.span>
                      <span className="text-sm text-muted-foreground mx-1.5 font-medium">de</span>
                      <span className="text-xl font-medium text-muted-foreground">
                        {videoLimits.monthlyLimit}
                      </span>
                    </div>
                    
                    <div className={`px-2.5 py-1 rounded-md ${monthlyTheme.bgColor} flex items-center gap-1.5`}>
                      {monthlyTheme.statusIcon}
                      <span className={`text-xs font-medium ${monthlyTheme.textColor}`}>
                        {isAtMonthlyLimit 
                          ? "Límite alcanzado" 
                          : isNearMonthlyLimit 
                            ? "Casi completo" 
                            : monthlyUsagePercentage > 40 
                              ? "Progresando" 
                              : "Iniciando mes"}
                      </span>
                    </div>
                  </div>
                  
                  {/* Progress bar para límites mensuales */}
                  <div className="relative w-full">
                    <Progress 
                      value={monthlyUsagePercentage} 
                      className={`h-2.5 ${monthlyTheme.progressColor}`} 
                    />
                    <motion.div 
                      className={`absolute top-0 h-2.5 w-1.5 bg-white border-l border-r ${monthlyTheme.borderColor}`}
                      style={{ left: `${Math.min(monthlyUsagePercentage, 98)}%` }}
                      initial={{ height: "0.4rem" }}
                      animate={{ height: "0.7rem", top: "-0.1rem" }}
                      transition={{ 
                        repeat: Infinity, 
                        repeatType: "reverse", 
                        duration: 1.5 
                      }}
                    />
                  </div>
                  
                  {/* Información de límite mensual */}
                  <div className={cn(
                    "p-3 rounded-md border text-sm",
                    hasSpecificLimit 
                      ? "bg-amber-50 border-amber-100" 
                      : "bg-gray-50 border-gray-100"
                  )}>
                    <div className="flex items-center gap-2 text-gray-700">
                      {hasSpecificLimit ? (
                        <>
                          <CalendarCheck className="h-4 w-4 text-amber-600" />
                          <span className="font-medium flex items-center gap-1.5">
                            Videos completados este mes
                            <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                              <Star className="h-2.5 w-2.5" />
                              Límite específico
                            </span>
                          </span>
                        </>
                      ) : (
                        <>
                          <Calendar className="h-4 w-4" />
                          <span className="font-medium">Videos completados este mes</span>
                        </>
                      )}
                    </div>
                    
                    {hasSpecificLimit && (
                      <div className="flex items-center gap-1.5 mt-2 text-[11px] text-amber-700 bg-amber-100/50 px-2 py-1 rounded">
                        <ListTodo className="h-3 w-3" />
                        Tienes un límite mensual personalizado para este mes
                      </div>
                    )}
                    
                    <p className="text-xs text-muted-foreground mt-2">
                      {isAtMonthlyLimit 
                        ? `Has alcanzado tu límite mensual de ${videoLimits.monthlyLimit} videos. El contador se reiniciará el primer día del próximo mes.`
                        : `Has completado ${videoLimits.currentMonthlyCount} videos este mes de un total de ${videoLimits.monthlyLimit} permitidos.`}
                    </p>
                    <p className="text-xs mt-1 text-gray-500">
                      {isAtMonthlyLimit
                        ? "Podrás continuar trabajando en videos ya asignados pero no podrás tomar nuevos hasta el próximo mes."
                        : `Puedes completar ${videoLimits.monthlyLimit - videoLimits.currentMonthlyCount} videos más este mes.`}
                    </p>
                    
                    {hasSpecificLimit && (
                      <div className="mt-2 pt-2 border-t border-amber-200/50">
                        <p className="text-xs text-amber-700">
                          <Info className="h-3 w-3 inline mr-1" />
                          Tu supervisor ha establecido un límite personalizado para este mes específico.
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
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
                <div className="mt-5 p-4 rounded-lg bg-blue-50 flex items-start">
                  <Info className="h-5 w-5 text-blue-500" />
                  <div className="ml-3">
                    <p className="text-sm text-blue-600 font-medium">
                      Tu sistema de límites de videos
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Trabajas con dos tipos de límites para garantizar calidad y balance:
                    </p>
                    <ul className="mt-2 text-sm space-y-2">
                      <li className="flex gap-2">
                        <Video className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span>
                          <strong className="text-gray-700">Límite de asignación:</strong> Máximo {videoLimits.maxAssignedAllowed} videos asignados a la vez. 
                          Esto evita sobrecarga de trabajo y garantiza que puedas enfocarte.
                        </span>
                      </li>
                      <li className="flex gap-2">
                        {hasSpecificLimit ? (
                          <CalendarCheck className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        ) : (
                          <Calendar className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        )}
                        <span>
                          <strong className="text-gray-700 flex items-center gap-1.5">
                            Límite mensual:
                            {hasSpecificLimit && (
                              <span className="bg-amber-100 text-amber-800 text-[10px] px-1 py-0.5 rounded-full flex items-center gap-0.5">
                                <Star className="h-2 w-2" />
                                Específico
                              </span>
                            )}
                          </strong> 
                          <span className="block mt-0.5">
                            Máximo {videoLimits.monthlyLimit} videos completados por mes.
                            Diseñado para mantener un ritmo saludable y sostenible.
                          </span>
                          {hasSpecificLimit && (
                            <span className="block mt-1 text-xs text-amber-700">
                              <Info className="h-3 w-3 inline mr-1" />
                              Tu supervisor ha configurado un límite personalizado para este mes.
                            </span>
                          )}
                        </span>
                      </li>
                    </ul>
                    <div className="mt-3 text-xs text-muted-foreground border-t border-muted/20 pt-2">
                      <span className="block">
                        Estos límites están personalizados según tu capacidad y rendimiento. Si necesitas ajustarlos, 
                        contacta a tu supervisor.
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