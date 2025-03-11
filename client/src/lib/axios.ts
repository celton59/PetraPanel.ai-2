import axios from 'axios';

// Crear una instancia de axios con configuración personalizada
const api = axios.create({
  withCredentials: true,  // Enviar cookies en todas las peticiones
  timeout: 30000,  // Tiempo de espera de 30 segundos
});

// Token CSRF almacenado en memoria 
let csrfToken: string | null = null;

/**
 * Función para actualizar el token CSRF de forma proactiva
 * Esta función se puede llamar antes de operaciones importantes o cuando se detecta un error de CSRF
 */
export const refreshCSRFToken = async (): Promise<string> => {
  try {
    const response = await axios.get('/api/csrf-token', { withCredentials: true });
    const newToken = response.data.csrfToken;
    
    // Actualizar el token en memoria
    csrfToken = newToken;
    
    // Actualizar el meta tag si existe
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    if (metaTag) {
      metaTag.setAttribute('content', newToken);
    } else {
      // Crear el meta tag si no existe
      const newMetaTag = document.createElement('meta');
      newMetaTag.name = 'csrf-token';
      newMetaTag.content = newToken;
      document.head.appendChild(newMetaTag);
    }
    
    console.log('CSRF Token actualizado correctamente');
    return newToken;
  } catch (error) {
    console.error('Error al actualizar el token CSRF:', error);
    throw error;
  }
};

// Interceptor para añadir el token CSRF en todas las peticiones
api.interceptors.request.use(async (config) => {
  // Primero intentamos obtener el token de nuestra variable en memoria
  let token = csrfToken;
  
  // Si no tenemos token en memoria, intentamos obtenerlo del meta tag
  if (!token) {
    token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || null;
    // Guardar el token en memoria si existe
    if (token) {
      csrfToken = token;
    }
  }
  
  // Si aún no tenemos token, lo solicitamos al servidor
  if (!token && (config.method === 'post' || config.method === 'patch' || config.method === 'put' || config.method === 'delete')) {
    try {
      token = await refreshCSRFToken();
    } catch (error) {
      console.error('No se pudo obtener un token CSRF fresco:', error);
    }
  }
  
  // Establecer el token en los headers si existe
  if (token) {
    config.headers['X-CSRF-Token'] = token;
  }
  
  return config;
});

// Interceptor para manejar respuestas y errores CSRF
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Verificar si es un error de CSRF y no se ha intentado ya
    if (
      error.response && 
      (error.response.status === 403 || error.response.status === 419) && 
      (error.response.data?.message?.includes('CSRF') || error.response.data?.message?.includes('csrf') || error.response.data?.message?.includes('token') || error.response.data?.message?.includes('Token')) && 
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      
      try {
        // Refrescar el token CSRF
        const newToken = await refreshCSRFToken();
        
        // Actualizar el token en la solicitud original
        originalRequest.headers['X-CSRF-Token'] = newToken;
        
        // Reintentar la solicitud
        return api(originalRequest);
      } catch (refreshError) {
        // Si falla el refresco, propagamos el error original
        return Promise.reject(error);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;