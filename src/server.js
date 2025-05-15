import express from 'express';
import cors from 'cors';
import { getAgencyData, invalidateCache, preloadAgencyData, agencyConfig, queryCache } from './service/bigQueryDirectService.js';


const app = express();
const PORT = process.env.PORT || 3001;

// Habilitar CORS para permitir peticiones desde el frontend
app.use(cors());
app.use(express.json());

// Endpoint para obtener datos de una agencia específica
app.get('/api/data/:agencyName', async (req, res) => {
  try {
    const { agencyName } = req.params;
    // Convertir query params a filtros
    const filters = req.query;
    console.log(`Solicitud de datos para agencia: ${agencyName}, filtros:`, filters);

    // Forzar el uso de caché siempre que sea posible
    const useCache = true;

    const data = await getAgencyData(agencyName, filters, useCache);
    console.log(`Datos obtenidos para ${agencyName}: ${data.length} registros`);

    // Agregar log para inspeccionar los primeros registros
    if (data.length > 0) {
      console.log('Muestra del primer registro:', JSON.stringify(data[0]));
    }

    res.json(data);
  } catch (error) {
    console.error('Error en endpoint /api/data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Añadir un nuevo endpoint para verificar el estado de la caché
app.get('/api/cache/status', (req, res) => {
  try {
    // Obtener el estado de la caché
    const cacheEntries = [];

    // Obtener un resumen del estado de la caché para cada agencia
    Object.keys(agencyConfig).forEach(agencyName => {
      const config = agencyConfig[agencyName];

      // Buscar alguna entrada de caché para esta agencia
      let foundCache = false;
      let lastUpdated = null;
      let rowCount = 0;

      // Revisar todas las entradas de caché para esta agencia
      for (const [key, value] of queryCache.entries()) {
        if (key.startsWith(`${config.projectId}:`)) {
          foundCache = true;
          // Usar la entrada más reciente
          if (!lastUpdated || value.timestamp > lastUpdated) {
            lastUpdated = value.timestamp;
            rowCount = value.data?.length || 0;
          }
        }
      }

      cacheEntries.push({
        agency: agencyName,
        cached: foundCache,
        lastUpdated: lastUpdated ? new Date(lastUpdated).toLocaleString() : 'N/A',
        rowCount: rowCount
      });
    });

    res.json({
      status: 'success',
      cacheEntries,
      totalCacheEntries: queryCache.size,
      cacheSize: JSON.stringify(Object.fromEntries(queryCache)).length / 1024, // Tamaño aproximado en KB
      lastUpdate: new Date().toLocaleString()
    });
  } catch (error) {
    console.error('Error al obtener estado de la caché:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para invalidar caché - versión sin parámetros opcionales
app.post('/api/cache/invalidate', (req, res) => {
  try {
    console.log('Invalidando caché para todas las agencias');
    invalidateCache();
    res.json({ success: true, message: 'Caché invalidada para todas las agencias' });
  } catch (error) {
    console.error('Error en endpoint /api/cache/invalidate:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para invalidar caché para una agencia específica
app.post('/api/cache/invalidate/:agencyName', (req, res) => {
  try {
    const { agencyName } = req.params;
    console.log(`Invalidando caché para agencia: ${agencyName}`);

    invalidateCache(agencyName);

    res.json({ success: true, message: `Caché invalidada para ${agencyName}` });
  } catch (error) {
    console.error('Error en endpoint /api/cache/invalidate:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para precargar datos - versión sin parámetros opcionales
app.post('/api/preload', async (req, res) => {
  try {
    console.log('Precargando datos para todas las agencias');
    const success = await preloadAgencyData();
    res.json({ success, message: 'Datos precargados para todas las agencias' });
  } catch (error) {
    console.error('Error en endpoint /api/preload:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para precargar datos para una agencia específica
app.post('/api/preload/:agencyName', async (req, res) => {
  try {
    const { agencyName } = req.params;
    console.log(`Precargando datos para agencia: ${agencyName}`);

    const success = await preloadAgencyData(agencyName);

    res.json({
      success,
      message: `Datos precargados para ${agencyName}`
    });
  } catch (error) {
    console.error('Error en endpoint /api/preload:', error);
    res.status(500).json({ error: error.message });
  }
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor proxy para BigQuery ejecutándose en puerto ${PORT}`);
  console.log(`API disponible en http://localhost:${PORT}/api`);
});