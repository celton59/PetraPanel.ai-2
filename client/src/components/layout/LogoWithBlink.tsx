import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Video } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoWithBlinkProps {
  className?: string;
  iconSize?: number;
}

export const LogoWithBlink: React.FC<LogoWithBlinkProps> = ({ 
  className,
  iconSize = 5
}) => {
  const [isActive, setIsActive] = useState(false);

  return (
    <div 
      className={cn(
        "relative h-8 w-8 flex items-center justify-center bg-gradient-to-br from-primary/30 to-primary/10 rounded-md shadow-sm overflow-visible group",
        className
      )}
      onMouseEnter={() => {
        setIsActive(true);
      }}
      onMouseLeave={() => {
        setIsActive(false);
      }}
      onClick={() => {
        setIsActive(true);
        // Mantenemos el estado activo por 3 segundos después de hacer clic
        setTimeout(() => setIsActive(false), 3000);
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      {/* Indicador de actividad */}
      {isActive && (
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
        animate={isActive ? {
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
    </div>
  );
};