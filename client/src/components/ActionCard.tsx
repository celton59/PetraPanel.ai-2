import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ActionCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  iconColor?: string;
  iconBgColor?: string;
  className?: string;
  onClick?: () => void;
}

// Definimos un array de partículas con sus respectivos desplazamientos y retrasos
const particles = [
  { x: 20, y: -20, delay: 0 },
  { x: -20, y: -20, delay: 0.1 },
  { x: 20, y: 20, delay: 0.2 },
  { x: -20, y: 20, delay: 0.3 },
  { x: 0, y: -30, delay: 0.15 },
  { x: 30, y: 0, delay: 0.25 },
  { x: 0, y: 30, delay: 0.35 },
  { x: -30, y: 0, delay: 0.45 },
];

// Componente de partícula: cada una es un pequeño círculo que sale del centro
const Particle = ({ x, y, delay }: { x: number; y: number; delay: number; }) => (
  <motion.div
    className="absolute w-2 h-2 bg-current rounded-full"
    initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
    animate={{ opacity: 0, scale: 0, x, y }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.6, delay, ease: "easeOut" }}
  />
);

// Componente que envuelve al ícono y dispara el efecto de partículas al hacer hover
const IconWithParticles: React.FC<{ Icon: LucideIcon; iconColor: string; }> = ({ Icon, iconColor }) => {
  const [burst, setBurst] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  // Efecto de parpadeo para la cámara
  React.useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        setBurst(true);
        setTimeout(() => setBurst(false), 700);
      }, 2000);
      
      return () => clearInterval(interval);
    }
  }, [isRecording]);

  return (
    <motion.div
      className="relative flex items-center justify-center"
      onHoverStart={() => {
        setBurst(true);
        // Reiniciamos el estado después de la duración de la animación (700ms)
        setTimeout(() => setBurst(false), 700);
      }}
      onClick={() => {
        // Alternamos el estado de "grabación"
        setIsRecording(!isRecording);
      }}
    >
      {/* Indicador de grabación */}
      {isRecording && (
        <motion.div 
          className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"
          animate={{
            opacity: [1, 0.5, 1],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatType: "loop"
          }}
        />
      )}
      
      {/* Ícono principal con animación de rotación suave al iniciar "grabación" */}
      <motion.div
        animate={isRecording ? {
          rotateZ: [0, -10, 10, -5, 5, 0],
          scale: [1, 1.2, 0.9, 1.1, 1]
        } : {}}
        transition={{
          duration: 0.7,
          type: "spring",
          stiffness: 260,
          damping: 20
        }}
      >
        <Icon className={cn("w-5 h-5", iconColor)} />
      </motion.div>
      
      {/* Si burst es true, se muestran las partículas */}
      <AnimatePresence>
        {burst &&
          particles.map((particle, index) => (
            <Particle
              key={index}
              x={particle.x}
              y={particle.y}
              delay={particle.delay}
            />
          ))
        }
      </AnimatePresence>
    </motion.div>
  );
};

const ActionCard = ({ 
  icon: Icon, 
  title, 
  description, 
  iconColor = "text-primary", 
  iconBgColor = "bg-primary/10",
  className,
  onClick 
}: ActionCardProps) => {
  // Determina si este icono debería tener animación especial (para el icono de Video)
  const isVideoIcon = Icon.name === 'Video';

  return (
    <Card 
      className={cn(
        "transition-all duration-200 hover:scale-[1.02] cursor-pointer",
        "group hover:shadow-md dark:hover:shadow-primary/5 relative",
        "border border-muted/40 rounded-lg overflow-hidden",
        className
      )}
      onClick={onClick}
    >
      {/* Top accent with rich gradient matching the icon color */}
      <div className={cn(
        "absolute top-0 left-0 w-full h-1",
        iconColor === "text-primary" ? "bg-gradient-to-r from-primary via-primary/70 to-primary/40" : 
        iconColor === "text-blue-500" ? "bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400" :
        iconColor === "text-green-500" ? "bg-gradient-to-r from-green-600 via-green-500 to-green-400" :
        iconColor === "text-red-500" ? "bg-gradient-to-r from-red-600 via-red-500 to-red-400" :
        iconColor === "text-purple-500" ? "bg-gradient-to-r from-purple-600 via-purple-500 to-purple-400" :
        "bg-gradient-to-r from-primary via-primary/70 to-primary/40"
      )}></div>
      
      {/* Action card content */}
      <div className="p-5 relative">
        <div className="flex items-start gap-4">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center overflow-visible",
            "transition-all duration-200 group-hover:scale-110",
            iconBgColor
          )}>
            {isVideoIcon ? (
              <IconWithParticles Icon={Icon} iconColor={iconColor} />
            ) : (
              <Icon className={cn("w-5 h-5", iconColor)} />
            )}
          </div>
          
          <div>
            <h3 className="font-medium text-base mb-1 group-hover:text-primary transition-colors">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ActionCard;