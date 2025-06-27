# Proxy HTTPS → HTTP

Este proyecto incluye funciones API que actúan como proxy para resolver problemas de mixed content cuando el frontend está desplegado en HTTPS pero el backend corre en HTTP.

## 🔧 Configuración

### Para Vercel

1. **Archivos necesarios:**
   - `api/proxy.js` - Función serverless de Vercel
   - `vercel.json` - Configuración de Vercel

2. **Despliegue:**
   ```bash
   npm run build
   vercel --prod
   ```

3. **URL del proxy:** `https://tu-app.vercel.app/api/proxy`

### Para Netlify

1. **Archivos necesarios:**
   - `netlify/functions/proxy.js` - Función serverless de Netlify  
   - `netlify.toml` - Configuración de Netlify

2. **Despliegue:**
   ```bash
   npm run build
   netlify deploy --prod --dir=dist
   ```

3. **URL del proxy:** `https://tu-app.netlify.app/api/proxy`

## 🚀 Cómo funciona

### Detección automática
El `apiClient.js` detecta automáticamente el entorno:

- **Desarrollo (HTTP):** Conecta directamente al backend `http://34.226.124.206:8000`
- **Producción (HTTPS):** Usa el proxy `/api/proxy/` que redirige al backend HTTP

### Ejemplo de uso

```javascript
// En desarrollo: GET http://34.226.124.206:8000/api/users
// En producción: GET https://tu-app.vercel.app/api/proxy/api/users → http://34.226.124.206:8000/api/users

const users = await api.get('/api/users');
```

## 🔑 Características

- ✅ **CORS habilitado:** Permite peticiones desde cualquier origen
- ✅ **Autenticación:** Reenvía headers de Authorization
- ✅ **Todos los métodos HTTP:** GET, POST, PUT, DELETE, PATCH, OPTIONS
- ✅ **Manejo de errores:** Respuestas de error consistentes
- ✅ **Logs:** Registro de peticiones para debugging

## 🛠️ Backend requerido

Tu backend HTTP debe:

1. **Aceptar CORS** desde el dominio del proxy
2. **Manejar headers** reenviados correctamente
3. **Responder JSON** para compatibilidad

## 📝 Variables de entorno

Si necesitas configurar la URL del backend dinámicamente, puedes usar:

```javascript
const BACKEND_URL = process.env.VITE_BACKEND_URL || 'http://34.226.124.206:8000';
```

Y en tu `.env`:
```
VITE_BACKEND_URL=http://34.226.124.206:8000
```
