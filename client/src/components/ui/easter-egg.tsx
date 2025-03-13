import { useState, useEffect, ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useLocalStorage } from "@/hooks/use-local-storage";

// Tipos de easter eggs disponibles
export type EasterEggType = 
  | "confetti" 
  | "dance" 
  | "rainbow" 
  | "rocket" 
  | "secret" 
  | "celebration";

// Propiedades para el componente EasterEgg
export interface EasterEggProps {
  type: EasterEggType;
  id?: string;
  showOnce?: boolean;
  message?: string;
  position?: "top" | "center" | "bottom" | "random";
  duration?: number;
  isVisible: boolean;
  onComplete: () => void;
}

/**
 * Componente que muestra un easter egg animado
 * Versión simplificada sin canvas-confetti para evitar errores
 */
export function EasterEgg({
  type,
  id,
  showOnce = false,
  message,
  position = "center",
  duration = 5000,
  isVisible,
  onComplete
}: EasterEggProps) {
  const [closing, setClosing] = useState(false);
  const [seenEasterEggs, setSeenEasterEggs] = useLocalStorage<string[]>("seen-easter-eggs", []);
  
  // Determinar la posición del easter egg si es aleatoria
  const [actualPosition, setActualPosition] = useState(position);
  
  useEffect(() => {
    if (position === "random") {
      const positions: ("top" | "center" | "bottom")[] = ["top", "center", "bottom"];
      const randomIndex = Math.floor(Math.random() * positions.length);
      setActualPosition(positions[randomIndex]);
    } else {
      setActualPosition(position);
    }
  }, [position]);
  
  // Registrar el easter egg como visto si tiene ID y showOnce
  useEffect(() => {
    if (isVisible && id && showOnce) {
      setSeenEasterEggs((prev) => {
        if (!prev.includes(id)) {
          return [...prev, id];
        }
        return prev;
      });
    }
  }, [isVisible, id, showOnce, setSeenEasterEggs]);
  
  // Manejar el cierre automático del easter egg
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isVisible && !closing) {
      timer = setTimeout(() => {
        setClosing(true);
        setTimeout(() => {
          onComplete();
          setClosing(false);
        }, 500); // Tiempo para la animación de salida
      }, duration);
    }
    
    return () => {
      clearTimeout(timer);
    };
  }, [isVisible, closing, duration, onComplete]);
  
  // No mostrar si no es visible
  if (!isVisible) return null;
  
  // Obtener el contenido según el tipo de easter egg
  const getEasterEggContent = (): ReactNode => {
    switch (type) {
      case "confetti":
        return (
          <div className="text-center py-4 px-6">
            <p className="font-medium">{message || "¡Felicidades!"}</p>
            <div className="flex justify-center mt-2 space-x-2">
              {["🎉", "🎊", "🎈"].map((emoji, index) => (
                <span key={index} className="text-2xl">{emoji}</span>
              ))}
            </div>
          </div>
        );
      case "dance":
        return (
          <div className="text-center py-4 px-6">
            <div className="flex justify-center mb-3">
              <motion.div
                animate={{
                  y: [0, -10, 0, -5, 0],
                  rotate: [0, 5, 0, -5, 0]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  repeatType: "loop"
                }}
                className="text-4xl"
              >
                💃
              </motion.div>
            </div>
            {message && <p className="font-medium">{message}</p>}
          </div>
        );
      case "rainbow":
        return (
          <div className="text-center py-4 px-6">
            <div className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 animate-gradient-x font-bold text-lg mb-2">
              {message || "¡Has descubierto un easter egg!"}
            </div>
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "loop"
              }}
              className="text-3xl"
            >
              🌈
            </motion.div>
          </div>
        );
      case "rocket":
        return (
          <div className="text-center py-4 px-6">
            {message && <p className="font-medium mb-2">{message}</p>}
            <motion.div
              initial={{ y: 40 }}
              animate={{ y: -40 }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatType: "loop"
              }}
              className="text-3xl"
            >
              🚀
            </motion.div>
          </div>
        );
      case "secret":
        return (
          <div className="text-center py-4 px-6">
            <div className="flex justify-center mb-2">
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, 0, -10, 0]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  repeatType: "loop"
                }}
                className="text-3xl"
              >
                🔐
              </motion.div>
            </div>
            <p className="font-medium">{message || "¡Has descubierto un código secreto!"}</p>
          </div>
        );
      case "celebration":
        return (
          <div className="text-center py-4 px-6">
            <div className="flex justify-center space-x-3 mb-3">
              {["🎉", "🎊", "🎈"].map((emoji, index) => (
                <motion.div
                  key={index}
                  animate={{
                    y: [0, -15, 0],
                    scale: [1, 1.2, 1],
                    rotate: [0, 15, 0, -15, 0]
                  }}
                  transition={{
                    duration: 1.5,
                    delay: index * 0.2,
                    repeat: Infinity,
                    repeatType: "loop"
                  }}
                  className="text-3xl"
                >
                  {emoji}
                </motion.div>
              ))}
            </div>
            <p className="font-medium">{message || "¡Felicidades!"}</p>
          </div>
        );
      default:
        return (
          <div className="text-center py-4 px-6">
            <p className="font-medium">{message || "¡Has descubierto un easter egg!"}</p>
          </div>
        );
    }
  };
  
  const positionClasses = {
    top: "top-4",
    center: "top-1/2 -translate-y-1/2",
    bottom: "bottom-4"
  };
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -10 }}
          transition={{ duration: 0.3 }}
          className={cn(
            "fixed left-1/2 -translate-x-1/2 z-[9999] max-w-md w-full p-2",
            positionClasses[actualPosition as keyof typeof positionClasses]
          )}
        >
          <div className={cn(
            "rounded-lg shadow-lg overflow-hidden bg-white dark:bg-gray-800",
            "border border-gray-200 dark:border-gray-700",
            "transition-all transform"
          )}>
            {getEasterEggContent()}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}