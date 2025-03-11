import axios from 'axios';

// Crear una instancia personalizada de Axios
const axiosInstance = axios.create({
  baseURL: '/',
  withCredentials: true,
});

// Función para obtener el token CSRF del meta tag
function getCsrfToken() {
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
}

// Agregar un interceptor para incluir el token CSRF en todas las solicitudes que modifican datos
axiosInstance.interceptors.request.use(
  (config) => {
    // Verificar si el método es una operación de mutación (POST, PUT, DELETE, PATCH)
    const mutationMethods = ['post', 'put', 'delete', 'patch'];
    if (config.method && mutationMethods.includes(config.method.toLowerCase())) {
      // Agregar el token CSRF al encabezado
      config.headers['X-CSRF-Token'] = getCsrfToken();
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Manejar errores específicos
    if (error.response) {
      // Si es un error de CSRF (código 403 con mensaje específico)
      if (error.response.status === 403 && 
          error.response.data && 
          typeof error.response.data === 'string' && 
          error.response.data.includes('CSRF')) {
        console.error('Error de validación CSRF. Recargando token...');
        
        // Aquí podríamos recargar el token si es necesario
        // Y luego reintentar la solicitud
      }
    }
    return Promise.reject(error);
  }
);

// Función para obtener/actualizar el token CSRF
export async function refreshCsrfToken() {
  try {
    const response = await axios.get('/api/csrf-token');
    const token = response.data.csrfToken;
    
    // Actualizar el meta tag
    let metaTag = document.querySelector('meta[name="csrf-token"]');
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.setAttribute('name', 'csrf-token');
      document.head.appendChild(metaTag);
    }
    metaTag.setAttribute('content', token);
    
    return token;
  } catch (error) {
    console.error('Error al obtener el token CSRF:', error);
    return null;
  }
}

// Exportar la instancia personalizada como valor por defecto
export default axiosInstance;

// También exportar una versión de axios original sin modificar (por si es necesario)
export { axios as axiosOriginal };