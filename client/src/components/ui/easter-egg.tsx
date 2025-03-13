import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { MascotLoader } from "@/components/ui/mascot-loader";
import { useLocalStorage } from "@/hooks/use-local-storage";

// Tipos de easter eggs disponibles 
export type EasterEggType = 
  | "confetti"     // Explosión de confeti
  | "dance"        // Mascota bailando
  | "rainbow"      // Arcoiris de colores
  | "rocket"       // Mascota despegando como cohete
  | "secret"       // Mensaje secreto
  | "celebration"; // Celebración especial (para hitos)

interface EasterEggProps {
  /**
   * Tipo de easter egg a mostrar
   */
  type: EasterEggType;
  
  /**
   * Código secreto para activar el easter egg (opcional)
   * Si se proporciona, el easter egg solo se mostrará si el usuario
   * introduce esta secuencia de teclas o hace un patrón específico
   */
  secretCode?: string;
  
  /**
   * Mensaje a mostrar con el easter egg (opcional)
   */
  message?: string;
  
  /**
   * Duración del easter egg en milisegundos
   * @default 5000
   */
  duration?: number;
  
  /**
   * Determina si el easter egg se muestra una sola vez por sesión/usuario
   * @default false
   */
  showOnce?: boolean;
  
  /**
   * Identificador único para el easter egg cuando se usa showOnce
   */
  id?: string;
  
  /**
   * Posición del easter egg en la pantalla
   * @default "center"
   */
  position?: "top" | "center" | "bottom" | "random";
  
  /**
   * Clase CSS personalizada
   */
  className?: string;
}

export function EasterEgg({
  type = "confetti",
  secretCode,
  message,
  duration = 5000,
  showOnce = false,
  id,
  position = "center",
  className
}: EasterEggProps) {
  const [visible, setVisible] = useState(false);
  const [keySequence, setKeySequence] = useState<string>("");
  const [seenEasterEggs, setSeenEasterEggs] = useLocalStorage<string[]>(
    "petra-easter-eggs-seen",
    []
  );

  // Verificar si este easter egg ya se ha visto (si showOnce es true)
  useEffect(() => {
    if (!secretCode) {
      // Si no hay código secreto, mostramos automáticamente
      if (showOnce && id) {
        if (!seenEasterEggs.includes(id)) {
          setVisible(true);
          setSeenEasterEggs([...seenEasterEggs, id]);
        }
      } else {
        setVisible(true);
      }
    }
  }, [id, seenEasterEggs, setSeenEasterEggs, showOnce, secretCode]);

  // Escuchar las teclas presionadas para detectar el código secreto
  useEffect(() => {
    if (!secretCode) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Actualizar la secuencia de teclas presionadas
      const newSequence = keySequence + e.key;
      
      // Mantener solo los últimos N caracteres (donde N es la longitud del código secreto)
      const relevantSequence = newSequence.slice(-secretCode.length);
      setKeySequence(relevantSequence);
      
      // Verificar si la secuencia coincide con el código secreto
      if (relevantSequence === secretCode) {
        if (showOnce && id) {
          if (!seenEasterEggs.includes(id)) {
            setVisible(true);
            setSeenEasterEggs([...seenEasterEggs, id]);
          }
        } else {
          setVisible(true);
        }
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [keySequence, secretCode, id, seenEasterEggs, setSeenEasterEggs, showOnce]);

  // Ocultar el easter egg después de la duración especificada
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        setVisible(false);
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [visible, duration]);

  // Calcular la posición del easter egg
  const getPositionClasses = () => {
    switch (position) {
      case "top":
        return "top-10";
      case "bottom":
        return "bottom-10";
      case "random":
        const positions = ["top-10", "top-1/4", "top-1/3", "bottom-10", "bottom-1/4", "bottom-1/3"];
        return positions[Math.floor(Math.random() * positions.length)];
      case "center":
      default:
        return "top-1/2 -translate-y-1/2";
    }
  };

  // Renderizado del contenido según el tipo de easter egg
  const renderEasterEggContent = () => {
    switch (type) {
      case "confetti":
        return (
          <div className="relative">
            {/* Fondo de confeti */}
            <div className="absolute inset-0 overflow-hidden">
              {Array.from({ length: 50 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full w-2 h-2"
                  style={{
                    backgroundColor: [
                      "#FF5733", "#33FF57", "#3357FF", "#F3FF33", 
                      "#FF33F3", "#33FFF3", "#FF3333", "#33FF33"
                    ][i % 8],
                    left: `${Math.random() * 100}%`,
                    top: 0,
                  }}
                  initial={{ top: "-10%" }}
                  animate={{ 
                    top: "110%", 
                    x: Math.random() * 200 - 100,
                    rotate: Math.random() * 360
                  }}
                  transition={{ 
                    duration: 2 + Math.random() * 3,
                    repeat: Infinity,
                    repeatType: "loop",
                    delay: Math.random() * 2
                  }}
                />
              ))}
            </div>
            
            {/* Mascota celebrando */}
            <div className="relative z-10">
              <MascotLoader animation="dance" size="xl" text={message || "¡Sorpresa!"} />
            </div>
          </div>
        );
        
      case "dance":
        return (
          <div className="relative flex flex-col items-center">
            <motion.div
              animate={{ 
                y: [0, -20, 0, -15, 0],
                rotate: [0, 5, 0, -5, 0]
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity
              }}
            >
              <MascotLoader animation="dance" size="xl" text={message || "¡A bailar!"} />
            </motion.div>
            
            {/* Notas musicales flotando alrededor */}
            {["♪", "♫", "♩", "♬", "♪", "♫"].map((note, i) => (
              <motion.div
                key={i}
                className="absolute text-primary text-2xl font-bold"
                style={{
                  left: `${20 + (i * 10)}%`,
                  top: "30%"
                }}
                initial={{ opacity: 0, y: 0 }}
                animate={{ 
                  opacity: [0, 1, 0],
                  y: -50,
                  x: (i % 2 === 0) ? 20 : -20
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "loop",
                  delay: i * 0.3
                }}
              >
                {note}
              </motion.div>
            ))}
          </div>
        );
        
      case "rainbow":
        return (
          <div className="relative">
            {/* Fondo de arcoiris */}
            <motion.div 
              className="absolute inset-0 rounded-xl overflow-hidden"
              animate={{
                background: [
                  "linear-gradient(to right, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8b00ff)",
                  "linear-gradient(to right, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8b00ff, #ff0000)",
                  "linear-gradient(to right, #ffff00, #00ff00, #0000ff, #4b0082, #8b00ff, #ff0000, #ff7f00)",
                  "linear-gradient(to right, #00ff00, #0000ff, #4b0082, #8b00ff, #ff0000, #ff7f00, #ffff00)",
                  "linear-gradient(to right, #0000ff, #4b0082, #8b00ff, #ff0000, #ff7f00, #ffff00, #00ff00)",
                  "linear-gradient(to right, #4b0082, #8b00ff, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff)",
                  "linear-gradient(to right, #8b00ff, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082)",
                ]
              }}
              transition={{ 
                duration: 5,
                repeat: Infinity,
                repeatType: "loop"
              }}
            >
              <div className="w-full h-full bg-opacity-20 backdrop-blur-sm p-8 flex items-center justify-center">
                <MascotLoader animation="jump" size="xl" text={message || "¡Colores!"} />
              </div>
            </motion.div>
          </div>
        );
        
      case "rocket":
        return (
          <motion.div
            className="relative"
            initial={{ y: 0 }}
            animate={{ y: [-20, -window.innerHeight] }}
            transition={{ 
              duration: 3,
              ease: [0.33, 1, 0.68, 1]
            }}
          >
            <div className="relative">
              <MascotLoader animation="jump" size="xl" text={message || "¡Despegue!"} />
              
              {/* Fuego del cohete */}
              <motion.div
                className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 w-10 h-20"
                style={{
                  background: "linear-gradient(to top, #FF5733, #FFC300, transparent)",
                  borderRadius: "0 0 50% 50%"
                }}
                animate={{ 
                  height: [20, 30, 20],
                  opacity: [1, 0.8, 1]
                }}
                transition={{ 
                  duration: 0.5, 
                  repeat: Infinity,
                  repeatType: "mirror"
                }}
              />
            </div>
          </motion.div>
        );
        
      case "secret":
        return (
          <motion.div
            className="bg-black bg-opacity-80 p-6 rounded-xl max-w-md text-center"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", duration: 0.5 }}
          >
            <MascotLoader animation="thinking" size="lg" text="" />
            <h3 className="text-lg font-bold text-white mt-4">¡Mensaje Secreto Descubierto!</h3>
            <p className="text-gray-200 mt-2">{message || "Has encontrado un mensaje oculto. ¡Felicidades!"}</p>
            <div className="mt-4 text-sm text-gray-400">
              Este es un easter egg secreto de PetraPanel
            </div>
          </motion.div>
        );
      
      case "celebration":
        return (
          <div className="relative">
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Fuegos artificiales */}
              {Array.from({ length: 20 }).map((_, i) => {
                const x = Math.random() * 100;
                const y = 30 + Math.random() * 40;
                const size = 5 + Math.random() * 15;
                const color = [
                  "#FF5733", "#33FF57", "#3357FF", "#F3FF33", 
                  "#FF33F3", "#33FFF3", "#00FFFF", "#FF00FF"
                ][i % 8];
                
                return (
                  <motion.div 
                    key={i}
                    className="absolute rounded-full"
                    style={{ 
                      left: `${x}%`, 
                      top: `${y}%`,
                      width: size,
                      height: size,
                      backgroundColor: color
                    }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{
                      scale: [0, 1.5, 0],
                      opacity: [0, 1, 0],
                      y: [0, Math.random() * -30]
                    }}
                    transition={{
                      duration: 1.5,
                      delay: Math.random() * 2,
                      repeat: Infinity,
                      repeatDelay: Math.random() * 2 + 1
                    }}
                  />
                );
              })}
            </motion.div>
            
            <div className="relative z-10 bg-black bg-opacity-60 p-6 rounded-xl text-center">
              <MascotLoader animation="dance" size="xl" text="" />
              <h3 className="text-xl font-bold text-white mt-4">¡FELICIDADES!</h3>
              <p className="text-gray-200 mt-2">{message || "¡Has alcanzado un hito importante!"}</p>
            </div>
          </div>
        );
        
      default:
        return <MascotLoader animation="wave" size="lg" text={message || "¡Sorpresa!"} />;
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className={cn(
            "fixed left-1/2 -translate-x-1/2 z-50 pointer-events-none",
            getPositionClasses(),
            className
          )}
        >
          {renderEasterEggContent()}
        </motion.div>
      )}
    </AnimatePresence>
  );
}