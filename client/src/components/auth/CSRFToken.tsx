import { useEffect, useState } from 'react';
import axios from 'axios';

/**
 * Componente para obtener y establecer el token CSRF
 * Este componente realiza una petición a la API y establece el token CSRF
 * en una meta tag para que esté disponible para todas las peticiones
 */
export function CSRFToken() {
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  useEffect(() => {
    const fetchCSRFToken = async () => {
      try {
        // Realizar una petición GET para obtener el token del encabezado
        const response = await axios.get('/api/user', { withCredentials: true });
        
        // Obtener el token del encabezado de respuesta
        const token = response.headers['x-csrf-token'];
        
        if (token) {
          setCsrfToken(token);
        }
      } catch (error) {
        console.error('Error al obtener el token CSRF', error);
      }
    };

    fetchCSRFToken();
  }, []);

  return (
    <>
      {csrfToken && (
        <meta name="csrf-token" content={csrfToken} />
      )}
    </>
  );
}