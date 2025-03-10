import { useEffect, useState } from 'react';
import { refreshCSRFToken } from '../../lib/axios';

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
        // Usar la función centralizada para obtener el token
        const token = await refreshCSRFToken();
        
        if (token) {
          // Guardar en el estado
          setCsrfToken(token);
          console.log('CSRF Token inicializado correctamente');
        } else {
          console.warn('No se pudo obtener un token CSRF válido');
        }
      } catch (error) {
        console.error('Error al obtener el token CSRF', error);
      }
    };

    fetchCSRFToken();

    // Configurar un intervalo para refrescar el token cada 20 minutos para mayor seguridad
    const intervalId = setInterval(fetchCSRFToken, 20 * 60 * 1000);

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