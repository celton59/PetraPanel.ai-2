import axios from 'axios';

// Crear una instancia de axios con configuración personalizada
const api = axios.create({
  withCredentials: true,  // Enviar cookies en todas las peticiones
  timeout: 30000,  // Tiempo de espera de 30 segundos
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  xsrfCookieName: 'petrapanel_sid', // Nombre de la cookie de sesión que contiene el token CSRF
  xsrfHeaderName: 'X-CSRF-Token',   // Nombre del encabezado para enviar el token CSRF
});

// Función para obtener un token CSRF fresco
export const refreshCSRFToken = async (): Promise<string | null> => {
  try {
    const response = await axios.get('/api/csrf-token', { 
      withCredentials: true,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    const token = response.headers['x-csrf-token'] || 
                 (response.data && response.data.csrfToken);
    
    if (token) {
      localStorage.setItem('csrf-token', token);
      
      // Actualizar también el meta tag
      let metaTag = document.querySelector('meta[name="csrf-token"]');
      if (!metaTag) {
        metaTag = document.createElement('meta');
        metaTag.setAttribute('name', 'csrf-token');
        document.head.appendChild(metaTag);
      }
      metaTag.setAttribute('content', token);
      
      // Actualizar el header default para futuras peticiones
      api.defaults.headers.common['X-CSRF-Token'] = token;
      
      console.log('Nuevo token CSRF obtenido:', token.substring(0, 10) + '...');
      return token;
    }
    return null;
  } catch (error) {
    console.error('Error al refrescar el token CSRF:', error);
    return null;
  }
};

// Interceptor para añadir el token CSRF en todas las peticiones
api.interceptors.request.use(async config => {
  // Obtener token CSRF del localStorage (prioridad) o del meta tag
  let token = localStorage.getItem('csrf-token') || 
              document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
                
  // Si no hay token y no es una petición GET, intentar obtener uno nuevo
  if (!token && config.method?.toLowerCase() !== 'get') {
    console.log('No CSRF token available, fetching a new one...');
    token = await refreshCSRFToken();
  }
  
  if (token) {
    // Asegurarse de que los headers existan
    config.headers = config.headers || {};
    config.headers['X-CSRF-Token'] = token;
  } else if (config.method?.toLowerCase() !== 'get') {
    console.warn('No CSRF token available for non-GET request, may fail with 403');
  }
  
  return config;
});

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  response => {
    // Capturar token CSRF actualizado de la respuesta, si existe
    const newToken = response.headers['x-csrf-token'];
    if (newToken) {
      // Actualizar el token en localStorage y en el meta tag
      localStorage.setItem('csrf-token', newToken);
      const metaTag = document.querySelector('meta[name="csrf-token"]');
      if (metaTag) {
        metaTag.setAttribute('content', newToken);
      }
      api.defaults.headers.common['X-CSRF-Token'] = newToken;
    }
    return response;
  },
  async error => {
    // Obtener configuración de la petición original
    const originalRequest = error.config;
    
    // Evitar bucles infinitos si ya estamos reintentando
    if (originalRequest._retry) {
      return Promise.reject(error);
    }
    
    // Si recibimos un error 403 (Forbidden) que podría ser por CSRF token inválido
    if (error.response && (error.response.status === 403 || error.response.status === 401)) {
      // Marcar como reintento para evitar bucles
      originalRequest._retry = true;
      
      try {
        console.log(`Recibido error ${error.response.status}, intentando refrescar token...`);
        // Intentar obtener un nuevo token CSRF
        const newToken = await refreshCSRFToken();
        
        if (newToken) {
          // Reintentar la petición original con el nuevo token
          originalRequest.headers['X-CSRF-Token'] = newToken;
          
          // Si es error 401 (No autenticado), intentar obtener un nuevo token CSRF y reintentar
          if (error.response.status === 401 && originalRequest.url !== '/api/user') {
            console.log('Intentando refrescar sesión para petición:', originalRequest.url);
            
            // Primero verificar si podemos restaurar la sesión obteniendo el usuario
            try {
              // Intentar obtener el usuario actual
              await axios.get('/api/user', { 
                withCredentials: true,
                headers: { 'X-CSRF-Token': newToken }
              });
              
              // Si llegamos aquí, la sesión se restauró
              console.log('Sesión restaurada exitosamente');
            } catch (sessionError) {
              console.log('No se pudo restaurar la sesión, probablemente necesita iniciar sesión');
              // Si no podemos restaurar la sesión, redirigir al login
              if (window.location.pathname !== '/auth') {
                console.log('Redirigiendo al login debido a sesión expirada');
                window.location.href = '/auth';
                return Promise.reject(new Error('Sesión expirada'));
              }
            }
          }
          
          // Reintentar petición original
          return axios(originalRequest);
        }
      } catch (refreshError) {
        console.error('Error al refrescar token:', refreshError);
      }
    }
    
    // Para errores 401 en rutas protegidas, redirigir al login
    if (error.response && error.response.status === 401 && 
        originalRequest.url !== '/api/login' && 
        originalRequest.url !== '/api/csrf-token' &&
        originalRequest.url !== '/api/user' &&
        window.location.pathname !== '/auth') {
      
      console.log('Sesión expirada o no válida, redirigiendo al login');
      // Redirigir al login solo si no estamos ya allí
      window.location.href = '/auth';
      return Promise.reject(new Error('Sesión expirada'));
    }
    
    return Promise.reject(error);
  }
);

export default api;