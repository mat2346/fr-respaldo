import axios from 'axios';

// Obtener URL del backend desde variables de entorno
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://34.226.124.206:8000';

// Detectar si estamos en producción (HTTPS) o desarrollo (HTTP)
const isProduction = window.location.protocol === 'https:';
const baseURL = isProduction 
  ? '/api/proxy/'  // Usar proxy en producción (HTTPS)
  : `${BACKEND_URL}/`; // Directo en desarrollo (HTTP)

// Cliente base para todas las peticiones autenticadas
const api = axios.create({
  baseURL,
});

// Interceptor para añadir el token de autenticación a todas las solicitudes
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Añadir al interceptor de respuesta para manejar 401 automáticamente
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Si es un error 401 y no es un reintento
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Importar dinámicamente authService para evitar dependencias circulares
        const authService = await import('./authService').then(module => module.default);
        const newToken = await authService.refreshToken();
        
        // Actualizar el token en la petición original y reintentar
        if (newToken?.access) {
          originalRequest.headers['Authorization'] = `Bearer ${newToken.access}`;
          return axios(originalRequest);
        }
      } catch (refreshError) {
        // Si no se puede renovar, redirigir al login
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Cliente para peticiones públicas (sin autenticación)
const publicBaseURL = isProduction 
  ? '/api/proxy'  // Usar proxy en producción (HTTPS)
  : BACKEND_URL; // Directo en desarrollo (HTTP)

const publicApi = axios.create({
  baseURL: publicBaseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});


// Asegurar que la exportación sea correcta
export { publicApi };
export default api;


