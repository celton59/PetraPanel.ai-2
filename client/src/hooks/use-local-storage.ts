import { useState, useEffect } from "react";

/**
 * Hook personalizado para manejar el almacenamiento local
 * @param key Clave para almacenar/recuperar datos
 * @param initialValue Valor inicial si no hay datos almacenados
 * @returns Tupla [valor actual, función para actualizar valor]
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // Estado para mantener el valor actual
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }
    
    try {
      // Intentar obtener el valor del localStorage
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error("Error al recuperar del localStorage:", error);
      return initialValue;
    }
  });
  
  // Función para actualizar el valor en localStorage y estado
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Permitir actualización basada en valor previo
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Guardar en estado
      setStoredValue(valueToStore);
      
      // Guardar en localStorage
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error("Error al guardar en localStorage:", error);
    }
  };
  
  // Efecto para sincronizar si cambia en otra pestaña
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        setStoredValue(JSON.parse(e.newValue));
      }
    };
    
    window.addEventListener("storage", handleStorageChange);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [key]);
  
  return [storedValue, setValue];
}