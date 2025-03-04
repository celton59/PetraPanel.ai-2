import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Video } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnimatedLogoProps {
  className?: string;
  iconSize?: number;
  showEffects?: boolean;
}

const particles = [
  { x: 10, y: -10, delay: 0 },
  { x: -10, y: -10, delay: 0.1 },
  { x: 10, y: 10, delay: 0.2 },
  { x: -10, y: 10, delay: 0.3 },
  { x: 0, y: -15, delay: 0.15 },
  { x: 15, y: 0, delay: 0.25 },
  { x: 0, y: 15, delay: 0.35 },
  { x: -15, y: 0, delay: 0.45 },
];

// Componente de partícula para efectos visuales
const Particle = ({ x, y, delay }: { x: number; y: number; delay: number; }) => (
  <motion.div
    className="absolute w-1 h-1 bg-primary rounded-full"
    initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
    animate={{ opacity: 0, scale: 0, x, y }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.6, delay, ease: "easeOut" }}
  />
);

export const AnimatedLogo: React.FC<AnimatedLogoProps> = ({ 
  className,
  iconSize = 5,
  showEffects = true
}) => {
  const [burst, setBurst] = useState(false);
  const [isActive, setIsActive] = useState(false);
  
  // Efecto que activa la animación periódicamente
  useEffect(() => {
    if (showEffects && isActive) {
      const interval = setInterval(() => {
        setBurst(true);
        setTimeout(() => setBurst(false), 700);
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [isActive, showEffects]);

  return (
    <div 
      className={cn(
        "relative h-8 w-8 flex items-center justify-center bg-gradient-to-br from-primary/30 to-primary/10 rounded-md shadow-sm overflow-visible group",
        className
      )}
      onMouseEnter={() => {
        if (showEffects) {
          setBurst(true);
          setIsActive(true);
          setTimeout(() => setBurst(false), 700);
        }
      }}
      onMouseLeave={() => {
        setIsActive(false);
      }}
      onClick={() => {
        if (showEffects) {
          setBurst(true);
          setTimeout(() => setBurst(false), 700);
        }
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      {/* Indicador de actividad */}
      {isActive && showEffects && (
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
      
      {/* Icono principal con animación */}
      <motion.div
        animate={isActive && showEffects ? {
          rotateZ: [0, -5, 5, -3, 3, 0],
          scale: [1, 1.1, 0.95, 1.05, 1]
        } : {}}
        transition={{
          duration: 0.7,
          type: "spring",
          stiffness: 260,
          damping: 20
        }}
        className="relative z-10"
      >
        <Video className={`h-${iconSize} w-${iconSize} text-primary`} />
      </motion.div>
      
      {/* Partículas */}
      {showEffects && (
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
      )}
    </div>
  );
};