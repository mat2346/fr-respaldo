// Función proxy para Netlify que redirige peticiones HTTPS → HTTP
// Esto resuelve problemas de mixed content cuando el frontend está en HTTPS
// y el backend en HTTP

exports.handler = async (event, context) => {
  const { httpMethod, path, headers, body, queryStringParameters } = event;
  
  // URL del backend HTTP
  const BACKEND_URL = 'http://34.226.124.206:8000';
  
  // Extraer la ruta de la petición (sin /.netlify/functions/proxy)
  const targetPath = path.replace('/.netlify/functions/proxy', '') || '/';
  
  // Construir query string si existe
  let queryString = '';
  if (queryStringParameters) {
    const params = new URLSearchParams(queryStringParameters);
    queryString = params.toString() ? `?${params.toString()}` : '';
  }
  
  // URL completa del backend
  const targetUrl = `${BACKEND_URL}${targetPath}${queryString}`;
  
  try {
    // Configurar headers para reenviar al backend
    const proxyHeaders = {
      'Content-Type': headers['content-type'] || 'application/json',
      'User-Agent': headers['user-agent'] || 'Netlify-Proxy',
    };
    
    // Reenviar token de autorización si existe
    if (headers.authorization) {
      proxyHeaders.Authorization = headers.authorization;
    }
    
    // Configurar opciones para la petición al backend
    const fetchOptions = {
      method: httpMethod,
      headers: proxyHeaders,
    };
    
    // Añadir body para métodos que lo requieren
    if (httpMethod !== 'GET' && httpMethod !== 'HEAD' && body) {
      fetchOptions.body = body;
    }
    
    console.log(`🔄 Netlify Proxy: ${httpMethod} ${targetUrl}`);
    
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
    
    // Manejar preflight OPTIONS
    if (httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        },
        body: '',
      };
    }
    
    // Retornar respuesta con headers CORS
    return {
      statusCode: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jsonData),
    };
    
  } catch (error) {
    console.error('❌ Error en Netlify proxy:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Error en el servidor proxy',
        message: error.message,
      }),
    };
  }
};
