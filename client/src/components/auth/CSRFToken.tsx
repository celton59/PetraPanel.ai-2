import { useEffect, useState } from 'react';
import { refreshCSRFToken } from '@/lib/axios';

/**
 * Componente que maneja la carga y actualización del token CSRF.
 * Se debe incluir una vez en la aplicación, idealmente cerca de la raíz.
 */
export function CSRFToken() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Función para cargar el token CSRF al iniciar
    const loadCsrfToken = async () => {
      try {
        await refreshCSRFToken();
        console.log('CSRF Token obtenido correctamente');
        setIsLoaded(true);
      } catch (error) {
        console.error('Error al cargar el token CSRF:', error);
        // Intentar de nuevo después de un retraso
        setTimeout(loadCsrfToken, 3000);
      }
    };

    loadCsrfToken();

    // Programar una actualización periódica del token (cada 30 minutos)
    const intervalId = setInterval(async () => {
      try {
        await refreshCSRFToken();
        console.log('CSRF Token actualizado');
      } catch (error) {
        console.error('Error al actualizar el token CSRF:', error);
      }
    }, 30 * 60 * 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  // Este componente no renderiza nada visible
  return null;
}

export default CSRFToken;