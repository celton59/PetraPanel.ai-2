import { useState, useEffect } from "react";

/**
 * Hook personalizado para gestionar estado en localStorage
 * @param key Clave para almacenar los datos en localStorage
 * @param initialValue Valor inicial si no existe valor en localStorage
 * @returns [storedValue, setValue] - Valor almacenado y función para modificarlo
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  // Inicializamos el estado con el valor de localStorage o el initialValue
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }
    
    try {
      const item = window.localStorage.getItem(key);
      // Si no existe el valor en localStorage, devolvemos initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error al recuperar "${key}" de localStorage:`, error);
      return initialValue;
    }
  });
  
  // Sincronizamos el estado con localStorage cuando cambia el valor
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(`Error al guardar "${key}" en localStorage:`, error);
    }
  }, [key, storedValue]);
  
  /**
   * Función para actualizar el valor en localStorage
   * Soporta actualizaciones basadas en el valor previo (como setState)
   */
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Si el valor es una función, la ejecutamos con el valor actual
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      
      // Actualizamos el estado React
      setStoredValue(valueToStore);
    } catch (error) {
      console.error(`Error al modificar "${key}" en localStorage:`, error);
    }
  };
  
  return [storedValue, setValue];
}

/**
 * Hook para eliminar un valor de localStorage
 * @param key Clave a eliminar de localStorage
 * @returns Función para eliminar el valor
 */
export function useLocalStorageRemove(key: string): () => void {
  return () => {
    if (typeof window === "undefined") {
      return;
    }
    
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error al eliminar "${key}" de localStorage:`, error);
    }
  };
}

/**
 * Hook para limpiar todos los valores de localStorage
 * @returns Función para limpiar localStorage
 */
export function useLocalStorageClear(): () => void {
  return () => {
    if (typeof window === "undefined") {
      return;
    }
    
    try {
      window.localStorage.clear();
    } catch (error) {
      console.error("Error al limpiar localStorage:", error);
    }
  };
}