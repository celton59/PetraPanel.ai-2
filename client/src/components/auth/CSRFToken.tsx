import { useEffect, useState } from 'react';
import axios from 'axios';

/**
 * Componente para obtener y establecer el token CSRF
 * Este componente realiza una petición a la API y establece el token CSRF
 * en una meta tag y en localStorage para que esté disponible para todas las peticiones
 */
export function CSRFToken() {
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  useEffect(() => {
    const fetchCSRFToken = async () => {
      try {
        // Realizar una petición GET para obtener el token del encabezado
        // Usamos una ruta que no requiera autenticación
        const response = await axios.get('/api/csrf-token', { withCredentials: true });
        
        // Obtener el token del encabezado de respuesta o del cuerpo
        const token = response.headers['x-csrf-token'] || (response.data && response.data.csrfToken);
        
        if (token) {
          // Guardar en el estado y también en localStorage para que el interceptor lo pueda usar
          setCsrfToken(token);
          localStorage.setItem('csrf-token', token);
          console.log('CSRF Token obtenido correctamente');
        } else {
          console.warn('No se recibió token CSRF en la respuesta');
        }
      } catch (error) {
        console.error('Error al obtener el token CSRF', error);
      }
    };

    fetchCSRFToken();

    // Configurar un intervalo para refrescar el token cada 30 minutos
    const intervalId = setInterval(fetchCSRFToken, 30 * 60 * 1000);

    // Limpiar el intervalo cuando el componente se desmonte
    return () => clearInterval(intervalId);
  }, []);

  // Agregamos el meta tag en el head y también creamos una meta tag dentro de nuestro retorno
  useEffect(() => {
    if (csrfToken) {
      // Buscar si ya existe la meta tag
      let metaTag = document.querySelector('meta[name="csrf-token"]');
      
      // Si no existe, crearla y agregarla al head
      if (!metaTag) {
        metaTag = document.createElement('meta');
        metaTag.setAttribute('name', 'csrf-token');
        document.head.appendChild(metaTag);
      }
      
      // Actualizar el contenido en cualquier caso
      metaTag.setAttribute('content', csrfToken);
    }
  }, [csrfToken]);

  return (
    <>
      {csrfToken && (
        <meta name="csrf-token" content={csrfToken} />
      )}
    </>
  );
}