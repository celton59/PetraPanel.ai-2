import axios from 'axios';

// Crear una instancia personalizada de Axios
const api = axios.create({
  baseURL: '/',
  withCredentials: true,
});


// Usaremos localStorage para mantener el token CSRF persistente entre refrescos de página
// y también en memoria para acceso más rápido
let csrfToken: string | null = localStorage.getItem('csrfToken');

/**
 * Función para actualizar el token CSRF de forma proactiva
 * Esta función se puede llamar antes de operaciones importantes o cuando se detecta un error de CSRF
 * @param forceRefresh Si es true, siempre se solicitará un nuevo token aunque ya exista uno
 */
export const refreshCSRFToken = async (forceRefresh: boolean = false): Promise<string> => {
  try {
    // Si ya tenemos un token y no se solicita forzar la actualización, lo devolvemos directamente
    if (csrfToken && !forceRefresh) {
      return csrfToken;
    }
    
    // Solicitar un nuevo token al servidor
    const response = await axios.get('/api/csrf-token', { 
      withCredentials: true,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    const newToken = response.data.csrfToken;
    
    // Actualizar el token en memoria y localStorage
    csrfToken = newToken;
    localStorage.setItem('csrfToken', newToken);
    
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
  // Intentamos obtener el token primero de localStorage para persistencia entre sesiones
  let token = localStorage.getItem('csrfToken');
  
  // Si tenemos token en localStorage, lo actualizamos en memoria
  if (token) {
    csrfToken = token;
  } else {
    // Si no hay token en localStorage, intentamos obtenerlo de memoria
    token = csrfToken;
  }
  
  // Si aún no tenemos token, intentamos obtenerlo del meta tag
  if (!token) {
    token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || null;
    // Guardar el token en memoria y localStorage si existe
    if (token) {
      csrfToken = token;
      localStorage.setItem('csrfToken', token);
    }
  }
  
  // Solicitar un nuevo token para métodos no seguros (mutaciones)
  const nonSafeMethods = ['post', 'put', 'patch', 'delete'];
  if (config.method && nonSafeMethods.includes(config.method.toLowerCase())) {
    try {
      // Para operaciones importantes siempre obtenemos un token fresco
      token = await refreshCSRFToken(!token); // Solo forzar si no hay token
    } catch (error) {
      console.error('No se pudo obtener un token CSRF fresco:', error);
      // Si hay error pero tenemos un token antiguo, lo usamos como fallback
      if (!token) {
        console.warn('Usando token CSRF antiguo como fallback');
      }
    }
  }
  
  // Establecer el token en los headers si existe
  if (token) {
    config.headers['X-CSRF-Token'] = token;
  }
  
  // Añadir timestamp para evitar caching en endpoints críticos
  if (config.url?.includes('/api/csrf-token') || config.url?.includes('/api/login') || config.url?.includes('/api/user')) {
    const timestamp = new Date().getTime();
    config.params = { ...config.params, _t: timestamp };
  }
  
  return config;
});

// Interceptor para manejar respuestas y errores CSRF
api.interceptors.response.use(
  (response) => {
    // Si la respuesta contiene un nuevo token CSRF, actualizarlo
    const newCsrfToken = response.headers['x-csrf-token'];
    if (newCsrfToken) {
      csrfToken = newCsrfToken;
      localStorage.setItem('csrfToken', newCsrfToken);
      
      // Actualizar el meta tag si existe
      const metaTag = document.querySelector('meta[name="csrf-token"]');
      if (metaTag) {
        metaTag.setAttribute('content', newCsrfToken);
      }
    }
    
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Si no hay configuración o ya hemos intentado 2 veces, rechazar
    if (!originalRequest || originalRequest._retryCount >= 2) {
      return Promise.reject(error);
    }
    
    // Inicializar contador de reintentos
    if (originalRequest._retryCount === undefined) {
      originalRequest._retryCount = 0;
    }
    
    // Detectar si es un error relacionado con CSRF o autenticación
    const isCsrfError = error.response && 
      (error.response.status === 403 || error.response.status === 419) && 
      (error.response.data?.message?.toLowerCase().includes('csrf') || 
       error.response.data?.message?.toLowerCase().includes('token'));
    
    // Detectar si es un error de sesión expirada
    const isSessionExpired = error.response && 
      error.response.status === 401 && 
      (error.response.data?.message?.toLowerCase().includes('sesión') || 
       error.response.data?.message?.toLowerCase().includes('autenticado') ||
       error.response.data?.message?.toLowerCase().includes('expirada'));
    
    // Si es un error de CSRF o sesión expirada, intentar recuperación
    if ((isCsrfError || isSessionExpired) && originalRequest._retryCount < 2) {
      originalRequest._retryCount++;
      
      try {
        // Forzar un nuevo token CSRF
        const newToken = await refreshCSRFToken(true);
        
        // Actualizar el token en la solicitud original
        originalRequest.headers['X-CSRF-Token'] = newToken;
        
        // Añadir un timestamp para evitar caché
        const timestamp = new Date().getTime();
        originalRequest.params = { ...originalRequest.params, _t: timestamp };
        
        console.log(`Reintentando petición (intento ${originalRequest._retryCount}/2) con nuevo token CSRF`);
        
        // Reintentar la solicitud
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Error al refrescar token CSRF para reintento:', refreshError);
        return Promise.reject(error);
      }
    }
    
    // Para otros errores, procesarlos según su tipo
    if (error.response) {
      // El servidor respondió con un código de estado fuera del rango 2xx
      console.warn(`Error ${error.response.status} en petición a ${originalRequest?.url}:`, 
        error.response.data?.message || 'Sin mensaje específico');
      
      // Si es un error 401 no tratado, podría ser una sesión expirada
      if (error.response.status === 401 && !isSessionExpired && originalRequest._retryCount < 1) {
        console.warn('Detectada posible sesión expirada, intentando refrescar token...');
        originalRequest._retryCount++;
        
        try {
          await refreshCSRFToken(true);
          return api(originalRequest);
        } catch (e) {
          console.error('Error al intentar recuperar sesión:', e);
        }
      }
    } else if (error.request) {
      // La petición fue hecha pero no se recibió respuesta
      console.error('No se recibió respuesta del servidor:', error.request);
    } else {
      // Error al configurar la petición
      console.error('Error al configurar la petición:', error.message);
    }
    
    return Promise.reject(error);
  }
);


export default api;
