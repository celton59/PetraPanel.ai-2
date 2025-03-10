import axios from 'axios';

// Crear una instancia de axios con configuración personalizada
const api = axios.create({
  withCredentials: true,  // Enviar cookies en todas las peticiones
  timeout: 30000,  // Tiempo de espera de 30 segundos
});

// Interceptor para añadir el token CSRF en todas las peticiones
api.interceptors.request.use(config => {
  // Obtener token CSRF del encabezado
  const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  if (token) {
    config.headers['X-CSRF-Token'] = token;
  }
  return config;
});

export default api;