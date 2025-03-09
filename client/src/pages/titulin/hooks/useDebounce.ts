import { useState, useEffect } from 'react';

/**
 * Hook personalizado para debounce
 * Retorna un valor que se actualiza después de un tiempo de espera
 * para evitar llamadas excesivas a operaciones costosas como peticiones API
 * 
 * @param value El valor a debounce
 * @param delay Tiempo de espera en milisegundos
 * @returns El valor después del tiempo de debounce
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Actualizar el valor debounced después del tiempo especificado
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cancelar el timer si el valor cambia (o el componente se desmonta)
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}