import { useState, useCallback, createContext, useContext, ReactNode } from "react";
import { EasterEggType } from "@/components/ui/easter-egg";
import { useLocalStorage } from "@/hooks/use-local-storage";

export interface EasterEggOptions {
  type: EasterEggType;
  message?: string;
  duration?: number;
  showOnce?: boolean;
  id?: string;
  position?: "top" | "center" | "bottom" | "random";
}

interface EasterEggInstance extends EasterEggOptions {
  key: string; // Identificador único para React
}

interface EasterEggContextType {
  showEasterEgg: (options: EasterEggOptions) => void;
  hideEasterEgg: () => void;
  activeEasterEgg: EasterEggInstance | null;
  seenEasterEggs: string[];
  resetSeenEasterEggs: () => void;
}

// Valor por defecto (para TypeScript)
const EasterEggContext = createContext<EasterEggContextType>({
  showEasterEgg: () => {},
  hideEasterEgg: () => {},
  activeEasterEgg: null,
  seenEasterEggs: [],
  resetSeenEasterEggs: () => {},
});

// Generador de ID único para cada instancia de easter egg
const generateEasterEggKey = () => `ee-${Math.random().toString(36).substring(2, 9)}`;

/**
 * Proveedor del contexto para los easter eggs
 */
export function EasterEggProvider({ children }: { children: ReactNode }) {
  const [activeEasterEgg, setActiveEasterEgg] = useState<EasterEggInstance | null>(null);
  const [seenEasterEggs, setSeenEasterEggs] = useLocalStorage<string[]>(
    "petra-easter-eggs-seen",
    []
  );

  const showEasterEgg = useCallback((options: EasterEggOptions) => {
    // Si está configurado para mostrarse una vez y ya se ha visto, no lo mostramos
    if (options.showOnce && options.id && seenEasterEggs.includes(options.id)) {
      console.log(`Easter egg '${options.id}' ya ha sido visto.`);
      return;
    }

    // Crear nueva instancia con un id único
    const newEasterEgg: EasterEggInstance = {
      ...options,
      key: generateEasterEggKey(),
    };

    // Añadir a la lista de vistos si es showOnce
    if (options.showOnce && options.id) {
      setSeenEasterEggs((prev) => {
        if (!prev.includes(options.id!)) {
          return [...prev, options.id!];
        }
        return prev;
      });
    }

    // Activar el easter egg
    setActiveEasterEgg(newEasterEgg);

    // Auto-ocultar después de la duración
    if (options.duration) {
      setTimeout(() => {
        hideEasterEgg();
      }, options.duration);
    }
  }, [seenEasterEggs, setSeenEasterEggs]);

  const hideEasterEgg = useCallback(() => {
    setActiveEasterEgg(null);
  }, []);

  const resetSeenEasterEggs = useCallback(() => {
    setSeenEasterEggs([]);
  }, [setSeenEasterEggs]);

  return (
    <EasterEggContext.Provider
      value={{
        showEasterEgg,
        hideEasterEgg,
        activeEasterEgg,
        seenEasterEggs,
        resetSeenEasterEggs,
      }}
    >
      {children}
    </EasterEggContext.Provider>
  );
}

/**
 * Hook personalizado para usar los easter eggs
 */
export function useEasterEggs() {
  const context = useContext(EasterEggContext);
  
  if (!context) {
    throw new Error("useEasterEggs debe usarse dentro de un EasterEggProvider");
  }
  
  return context;
}

/**
 * Hook para detectar secuencias de teclas específicas
 * @param secretCode Código secreto a detectar (por ejemplo "petra")
 * @param callback Función a ejecutar cuando se detecta el código
 */
export function useSecretCode(secretCode: string, callback: () => void) {
  useState(() => {
    let keySequence = "";
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Actualizar la secuencia de teclas presionadas
      keySequence += e.key;
      
      // Mantener solo los últimos N caracteres (donde N es la longitud del código secreto)
      if (keySequence.length > secretCode.length) {
        keySequence = keySequence.substring(keySequence.length - secretCode.length);
      }
      
      // Verificar si la secuencia coincide con el código secreto
      if (keySequence === secretCode) {
        keySequence = ""; // Resetear la secuencia
        callback();
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  });
}