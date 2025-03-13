import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { EasterEggType } from "@/components/ui/easter-egg";
import { useLocalStorage } from "@/hooks/use-local-storage";

// Opciones para mostrar un easter egg
export interface EasterEggOptions {
  type: EasterEggType;
  message?: string;
  duration?: number;
  position?: "top" | "center" | "bottom" | "random";
  showOnce?: boolean;
  id?: string;
}

// Contexto para los easter eggs
interface EasterEggContextType {
  activeEasterEgg: EasterEggOptions | null;
  showEasterEgg: (options: EasterEggOptions) => void;
  hideEasterEgg: () => void;
  seenEasterEggs: string[];
  resetSeenEasterEggs: () => void;
}

// Crear el contexto con valor por defecto
const EasterEggContext = createContext<EasterEggContextType>({
  activeEasterEgg: null,
  showEasterEgg: () => {},
  hideEasterEgg: () => {},
  seenEasterEggs: [],
  resetSeenEasterEggs: () => {}
});

// Hook personalizado para usar el contexto en componentes
export const useEasterEggs = () => useContext(EasterEggContext);

// Proveedor del contexto para easter eggs
export const EasterEggProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Estado para el easter egg activo
  const [activeEasterEgg, setActiveEasterEgg] = useState<EasterEggOptions | null>(null);
  
  // Usar localStorage para registrar los easter eggs vistos
  const [seenEasterEggs, setSeenEasterEggs] = useLocalStorage<string[]>("seen-easter-eggs", []);
  
  // Mostrar un easter egg
  const showEasterEgg = useCallback((options: EasterEggOptions) => {
    // Si el easter egg debe mostrarse solo una vez, verificar si ya fue visto
    if (options.showOnce && options.id && seenEasterEggs.includes(options.id)) {
      return;
    }
    
    // Activar el easter egg
    setActiveEasterEgg(options);
    
    // Si el easter egg debe mostrarse solo una vez, registrarlo como visto
    if (options.showOnce && options.id) {
      setSeenEasterEggs(prev => {
        if (!prev.includes(options.id!)) {
          return [...prev, options.id!];
        }
        return prev;
      });
    }
  }, [seenEasterEggs, setSeenEasterEggs]);
  
  // Ocultar el easter egg activo
  const hideEasterEgg = useCallback(() => {
    setActiveEasterEgg(null);
  }, []);
  
  // Reiniciar la lista de easter eggs vistos
  const resetSeenEasterEggs = useCallback(() => {
    setSeenEasterEggs([]);
  }, [setSeenEasterEggs]);
  
  // Valor del contexto
  const contextValue = {
    activeEasterEgg,
    showEasterEgg,
    hideEasterEgg,
    seenEasterEggs,
    resetSeenEasterEggs
  };
  
  return (
    <EasterEggContext.Provider value={contextValue}>
      {children}
    </EasterEggContext.Provider>
  );
};

// Hook para detectar secuencias de teclas y activar easter eggs
export function useSecretCode(code: string, callback: () => void) {
  const [sequence, setSequence] = useState<string[]>([]);
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignorar teclas especiales como ctrl, shift, alt, etc.
      if (
        event.ctrlKey || 
        event.altKey || 
        event.shiftKey || 
        event.metaKey ||
        ["Control", "Shift", "Alt", "Meta", "CapsLock", "Tab", "Escape"].includes(event.key)
      ) {
        return;
      }
      
      // Actualizar la secuencia con la nueva tecla
      const newSequence = [...sequence, event.key.toLowerCase()];
      
      // Limitar la secuencia a la longitud del código
      if (newSequence.length > code.length) {
        newSequence.shift();
      }
      
      setSequence(newSequence);
      
      // Verificar si la secuencia coincide con el código
      if (newSequence.join("") === code.toLowerCase()) {
        callback();
        // Reiniciar la secuencia después de activar el código
        setSequence([]);
      }
    };
    
    // Registrar el evento de teclado
    window.addEventListener("keydown", handleKeyDown);
    
    // Limpiar el evento al desmontar
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [code, callback, sequence]);
}