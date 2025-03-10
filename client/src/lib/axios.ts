import axios from 'axios';

// Crear una instancia de axios con configuración personalizada
const api = axios.create({
  withCredentials: true,  // Enviar cookies en todas las peticiones
  timeout: 30000,  // Tiempo de espera de 30 segundos
});

// Interceptor para añadir el token CSRF en todas las peticiones
api.interceptors.request.use(config => {
  // Obtener token CSRF del localStorage (prioridad) o del meta tag
  const token = localStorage.getItem('csrf-token') || 
                document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
                
  if (token) {
    config.headers['X-CSRF-Token'] = token;
  } else {
    // Si no hay token, intentar obtenerlo (solo para peticiones GET)
    if (config.method?.toLowerCase() === 'get') {
      console.log('No CSRF token available, will try to fetch one if needed');
    } else {
      console.warn('No CSRF token available for non-GET request');
    }
  }
  return config;
});

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  response => response,
  async error => {
    // Si recibimos un error 403 (Forbidden) que podría ser por CSRF token inválido
    if (error.response && error.response.status === 403 && 
        error.response.data?.message?.includes('validación de seguridad')) {
      // Intentar obtener un nuevo token
      try {
        const response = await axios.get('/api/csrf-token', { withCredentials: true });
        const newToken = response.headers['x-csrf-token'] || 
                         (response.data && response.data.csrfToken);
        
        if (newToken) {
          // Guardar el nuevo token
          localStorage.setItem('csrf-token', newToken);
          
          // Actualizar también el meta tag si existe
          const metaTag = document.querySelector('meta[name="csrf-token"]');
          if (metaTag) {
            metaTag.setAttribute('content', newToken);
          } else {
            // Crear el meta tag si no existe
            const newMetaTag = document.createElement('meta');
            newMetaTag.setAttribute('name', 'csrf-token');
            newMetaTag.setAttribute('content', newToken);
            document.head.appendChild(newMetaTag);
          }
          
          // Reintentar la petición original con el nuevo token
          const originalRequest = error.config;
          originalRequest.headers['X-CSRF-Token'] = newToken;
          return axios(originalRequest);
        }
      } catch (fetchError) {
        console.error('Error al obtener un nuevo CSRF token:', fetchError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;