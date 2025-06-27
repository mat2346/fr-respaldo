// Función proxy para Vercel que redirige peticiones HTTPS → HTTP
// Esto resuelve problemas de mixed content cuando el frontend está en HTTPS
// y el backend en HTTP

export default async function handler(req, res) {
  const { method, headers, body } = req;
  
  // URL del backend HTTP
  const BACKEND_URL = 'http://34.226.124.206:8000';
  
  // Extraer la ruta de la petición (sin /api/proxy)
  const targetPath = req.url.replace('/api/proxy', '') || '/';
  
  // URL completa del backend
  const targetUrl = `${BACKEND_URL}${targetPath}`;
  
  try {
    // Configurar headers para reenviar al backend
    const proxyHeaders = {
      'Content-Type': headers['content-type'] || 'application/json',
      'User-Agent': headers['user-agent'] || 'Vercel-Proxy',
    };
    
    // Reenviar token de autorización si existe
    if (headers.authorization) {
      proxyHeaders.Authorization = headers.authorization;
    }
    
    // Configurar opciones para la petición al backend
    const fetchOptions = {
      method,
      headers: proxyHeaders,
    };
    
    // Añadir body para métodos que lo requieren
    if (method !== 'GET' && method !== 'HEAD' && body) {
      fetchOptions.body = JSON.stringify(body);
    }
    
    console.log(`🔄 Proxy: ${method} ${targetUrl}`);
    
    // Realizar petición al backend HTTP
    const response = await fetch(targetUrl, fetchOptions);
    
    // Obtener datos de respuesta
    const data = await response.text();
    let jsonData;
    
    try {
      jsonData = JSON.parse(data);
    } catch {
      jsonData = data;
    }
    
    // Configurar headers CORS para el frontend
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    
    // Manejar preflight OPTIONS
    if (method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    // Reenviar código de estado y datos
    res.status(response.status).json(jsonData);
    
  } catch (error) {
    console.error('❌ Error en proxy:', error);
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).json({
      error: 'Error en el servidor proxy',
      message: error.message
    });
  }
}
