import React from 'react';
import { cn } from "@/lib/utils";

// Tipos de animaciones disponibles
export type MascotAnimationType = 'dance' | 'jump' | 'spin' | 'wave' | 'thinking';

// Props del componente
interface MascotLoaderProps {
  /**
   * Texto que se muestra debajo de la mascota
   */
  text?: string;
  
  /**
   * Tipo de animación a mostrar
   * @default 'dance'
   */
  animation?: MascotAnimationType;
  
  /**
   * Tamaño del loader
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  
  /**
   * Clases CSS adicionales
   */
  className?: string;
}

/**
 * Componente de carga animado con la mascota de PetraPanel
 */
export function MascotLoader({ 
  text = "Cargando...", 
  animation = 'dance', 
  size = 'md',
  className
}: MascotLoaderProps) {
  // Definimos las clases de tamaño para reutilizar
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-40 h-40'
  };
  
  // Animaciones CSS para cada tipo
  const animationClasses = {
    dance: 'animate-mascot-dance',
    jump: 'animate-mascot-jump',
    spin: 'animate-mascot-spin',
    wave: 'animate-mascot-wave',
    thinking: 'animate-mascot-thinking'
  };
  
  // Determinamos si debemos mostrar el texto o no
  const showText = text && text.length > 0;
  
  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-4",
      className
    )}>
      {/* Contenedor de la mascota con animación */}
      <div className={cn(
        "bg-primary/5 rounded-full p-3 border border-primary/20 shadow-sm",
        "flex items-center justify-center overflow-hidden",
        sizeClasses[size]
      )}>
        <div className={cn(
          "transform-gpu", 
          animationClasses[animation]
        )}>
          {/* SVG de la mascota */}
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            {/* Cuerpo principal */}
            <circle cx="50" cy="50" r="40" fill="hsl(var(--primary) / 0.2)" />
            <circle cx="50" cy="50" r="35" fill="hsl(var(--primary) / 0.3)" />
            
            {/* Ojos */}
            <circle cx="35" cy="40" r="6" fill="white" />
            <circle cx="65" cy="40" r="6" fill="white" />
            <circle cx="35" cy="40" r="3" fill="black" className="animate-mascot-eye-blink" />
            <circle cx="65" cy="40" r="3" fill="black" className="animate-mascot-eye-blink" />
            
            {/* Sonrisa */}
            <path
              d="M35 65 Q50 75 65 65"
              stroke="black"
              strokeWidth="2"
              fill="none"
              className="animate-mascot-smile"
            />
            
            {/* Antenas */}
            <line x1="42" y1="20" x2="45" y2="10" stroke="hsl(var(--primary))" strokeWidth="2" />
            <line x1="58" y1="20" x2="55" y2="10" stroke="hsl(var(--primary))" strokeWidth="2" />
            <circle cx="45" cy="8" r="3" fill="hsl(var(--primary))" className="animate-pulse" />
            <circle cx="55" cy="8" r="3" fill="hsl(var(--primary))" className="animate-pulse" />
            
            {/* Pequeños detalles decorativos */}
            <circle cx="50" cy="95" r="2" fill="hsl(var(--primary) / 0.5)" className="animate-ping" />
            <circle cx="40" cy="92" r="1.5" fill="hsl(var(--primary) / 0.5)" className="animate-ping" />
            <circle cx="60" cy="92" r="1.5" fill="hsl(var(--primary) / 0.5)" className="animate-ping" />
          </svg>
        </div>
      </div>
      
      {/* Texto de carga */}
      {showText && (
        <p className={cn(
          "mt-4 text-center text-muted-foreground font-medium",
          {
            'text-xs': size === 'sm',
            'text-sm': size === 'md',
            'text-base': size === 'lg',
            'text-lg': size === 'xl',
          }
        )}>
          {text}
        </p>
      )}
    </div>
  );
}