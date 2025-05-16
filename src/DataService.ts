// src/DataService.ts

import { AgenciaNombre } from './components/AgenciaSelector';


// URL base para el servidor proxy

const API_URL = 'https://lokerserver-production.up.railway.app/api';


// Definimos las interfaces para TypeScript
export interface Cliente {
  id: number;                  // ID secuencial
  serie: string;              // Número de serie del vehículo
  modelo: string;            // Modelo del vehículo
  año: number;              // Año de fabricación
  nombreFactura: string;   // Nombre del cliente para la factura                   
  contacto: string;
  agencia: string;
  celular: string;         // Campo obligatorio
  telefono?: string;       // Campo opcional
  tOficina?: string;       // Campo opcional (sin espacio ni punto)
  cloudtalk?: string;      // Campo opcional
  paquete?: string;        // Campo opcional
  orden?: number;          // Campo opcional
  total?: number;          // Campo opcional
  aps?: string;            // Campo opcional para APS
  ultimaVisita?: Date;     // Añadir esta propiedad para la fecha de última visita
  diasSinVenir: number;    // Nuevo campo para los días sin venir
}

// Configuración para cada agencia
export const configuracionAgencias = {
  'Gran Auto': {
    archivo: 'granauto.csv',
    encoding: 'cp1252',  // Codificación específica para Gran Auto
    mapeo: {
      modelo: 'Modelo',
      nombreFactura: 'NOMBRE_FAC',
      agencia: 'AGENCI',
      fechaUltimaVisita: 'ULT_VISITA'
    }
  },
  'Gasme': {
    archivo: 'gasme.csv',
    encoding: 'utf-8',
    mapeo: {
      modelo: 'MODELO',
      nombreFactura: 'NOMBRE_FAC',
      agencia: 'AGENCI',
      fechaUltimaVisita: 'FECHA_FAC'
    }
  },
  'Sierra': {
    archivo: 'sierra.csv',
    encoding: 'utf-8',
    mapeo: {
      modelo: 'MODELO',
      nombreFactura: 'NOMBRE_FAC',
      agencia: 'AGENCIA',
      fechaUltimaVisita: 'FECHA_FAC'
    }
  },
  'Huerpel': {
    archivo: 'huerpel.csv',
    encoding: 'utf-8',
    mapeo: {
      modelo: 'MODELO',
      nombreFactura: 'NOMBRE_FACT',
      agencia: 'AGENCIA',
      fechaUltimaVisita: 'ULT_VISITA'
    }
  },
  'Del Bravo': {
    archivo: 'delbravo.csv',
    encoding: 'utf-8',
    mapeo: {
      modelo: 'MODELO',
      nombreFactura: 'NOMBRE_FAC',
      agencia: 'AGENCIA',
      fechaUltimaVisita: 'ULT_VISITA'
    }
  }
};

// Sistema de caché para evitar recargar todo
let clientesDataCache: Cliente[] | null = null;
let agenciaActual: AgenciaNombre = 'Gran Auto';
let totalRegistros = 0;
let todosCargados = false; // Flag para saber si ya se cargaron todos los datos

// Función para establecer la agencia actual
export const establecerAgenciaActual = (agencia: AgenciaNombre): void => {
  // Verificar que la agencia existe en la configuración
  if (!configuracionAgencias[agencia]) {
    console.error(`Agencia no válida: ${agencia}. Usando 'Gran Auto' por defecto.`);
    agencia = 'Gran Auto'; // Valor por defecto
  }

  // Cambiar la agencia actual
  if (agenciaActual !== agencia) {
    clientesDataCache = null;
    todosCargados = false;
    agenciaActual = agencia;
    console.log(`Agencia cambiada a: ${agencia}`);
  }
};

// Función para mapear datos crudos a formato Cliente
const mapearDatosACliente = (datos: any[]): Cliente[] => {
  return datos.map((dato, index) => {
    // Extraer y formatear la fecha de última visita con mejor manejo de errores
    let ultimaVisita: Date | undefined = undefined;

    try {
      if (dato.ULT_VISITA) {
        // Agregar logs para depuración
        console.log("Procesando fecha:", dato.ULT_VISITA, "tipo:", typeof dato.ULT_VISITA);

        // Intentar varios formatos de fecha
        if (typeof dato.ULT_VISITA === 'string' && dato.ULT_VISITA.includes('/')) {
          // Formato DD/MM/YYYY
          const partes = dato.ULT_VISITA.split('/');
          if (partes.length === 3) {
            const [dia, mes, anio] = partes.map(Number);
            if (!isNaN(dia) && !isNaN(mes) && !isNaN(anio)) {
              ultimaVisita = new Date(anio, mes - 1, dia);
              // Validar que la fecha sea válida
              if (isNaN(ultimaVisita.getTime())) {
                ultimaVisita = undefined;
              }
            }
          }
        } else if (typeof dato.ULT_VISITA === 'string' && dato.ULT_VISITA.includes('-')) {
          // Formato YYYY-MM-DD
          ultimaVisita = new Date(dato.ULT_VISITA);
          // Validar que la fecha sea válida
          if (isNaN(ultimaVisita.getTime())) {
            ultimaVisita = undefined;
          }
        } else if (dato.FECHA_FAC instanceof Date) {
          // Si ya es un objeto Date
          ultimaVisita = dato.FECHA_FAC;
        }
      }
    } catch (error) {
      console.error('Error al convertir fecha:', error);
      console.error('Valor problemático:', dato.ULT_VISITA);
      ultimaVisita = undefined;
    }

    // Extraer campos según la configuración de la agencia
    const config = configuracionAgencias[agenciaActual];

    // Determinar el modelo
    const modeloField = config.mapeo.modelo;
    const modelo = (dato[modeloField] || dato.MODELO || '').toString();

    // Determinar el nombre de factura
    const nombreFacturaField = config.mapeo.nombreFactura;
    const nombreFactura = (dato[nombreFacturaField] || dato.NOMBRE_FAC || dato.NOMBRE_FACT || '').toString();

    // Determinar la agencia
    const agenciaField = config.mapeo.agencia;
    const agencia = (dato[agenciaField] || dato.AGENCIA || dato.AGENCI || agenciaActual).toString();

    // Determinar el año con mejor manejo de errores
    let anio = 0;
    try {
      if (dato.ANIO_VIN !== undefined) {
        anio = parseInt(dato.ANIO_VIN.toString(), 10);
      } else if (dato.AnioVeh_ !== undefined) {
        anio = parseInt(dato.AnioVeh_.toString(), 10);
      }
    } catch (error) {
      console.error('Error al convertir año:', error);
    }

    // Si el año no es un número válido, usar 0
    if (isNaN(anio)) anio = 0;

    // En DataService.ts, función mapearDatosACliente
    return {
      id: index + 1,
      serie: (dato.SERIE || '').toString(),
      modelo: modelo,
      año: anio,
      nombreFactura: nombreFactura,
      contacto: (dato.CONTACTO || '').toString(),
      agencia: agencia,
      celular: (dato.CELULAR || '').toString(),
      telefono: dato.TELEFONO ? dato.TELEFONO.toString() : undefined,
      tOficina: dato.OFICINA ? dato.OFICINA.toString() : undefined,
      cloudtalk: undefined,
      paquete: dato.PAQUETE !== undefined && dato.PAQUETE !== null ? dato.PAQUETE.toString() : undefined,
      orden: dato.ORDEN ? Number(dato.ORDEN) : undefined,
      total: dato.TOTAL ? Number(dato.TOTAL) : undefined,
      aps: (dato.NOMBRE_ASESOR || '').toString(),
      ultimaVisita: ultimaVisita,
      diasSinVenir: dato.DIAS_SIN_VENIR ? Number(dato.DIAS_SIN_VENIR) : 0
    };
  });
};

// Función modificada para cargar datos desde el proxy en lugar de BigQuery directamente
export const obtenerClientesPaginados = async (
  _pagina: number,
  _elementosPorPagina: number,
  _precargaCompleta: boolean = true,
  agencia?: AgenciaNombre
): Promise<{ clientes: Cliente[], total: number }> => {
  try {
    // Si se especifica una agencia, establecerla
    if (agencia) {
      establecerAgenciaActual(agencia);
    }

    // Si ya tenemos datos en caché, devolverlos sin hacer petición
    if (clientesDataCache && todosCargados) {
      console.log(`Usando datos en caché para ${agenciaActual}: ${clientesDataCache.length} registros`);
      return {
        clientes: clientesDataCache,
        total: totalRegistros
      };
    }

    console.log(`Consultando datos del servidor para ${agenciaActual}...`);

    // Añadir parámetro para forzar caché en el servidor
    const response = await fetch(`${API_URL}/data/${agenciaActual}?useCache=true`);

    if (!response.ok) {
      throw new Error(`Error al obtener datos: ${response.statusText}`);
    }

    const datos = await response.json();

    // Actualizar el conteo total
    totalRegistros = datos.length;

    // Mapear los datos al formato Cliente
    clientesDataCache = mapearDatosACliente(datos);

    // Marcar como cargados
    todosCargados = true;

    console.log(`Datos obtenidos del servidor para ${agenciaActual}: ${clientesDataCache.length} registros`);

    return {
      clientes: clientesDataCache,
      total: totalRegistros
    };
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    throw error;
  }
};

// Función para obtener metadatos para filtros
export const obtenerMetadatosFiltros = async (agencia?: AgenciaNombre): Promise<{
  agencias: string[];
  modelos: string[];
  años: string[];
  paquetes: string[];
  asesores: string[];
}> => {
  try {
    // Si se especifica una agencia, establecerla
    if (agencia) {
      establecerAgenciaActual(agencia);
    }

    // Cargar datos si no están en caché
    if (!clientesDataCache || !todosCargados) {
      await obtenerClientesPaginados(1, 1, true, agenciaActual);
    }

    if (!clientesDataCache) {
      throw new Error('No se pudieron cargar los datos');
    }

    // Extraer valores únicos para cada filtro
    const agencias = Array.from(new Set(clientesDataCache.map(cliente =>
      cliente.agencia.trim()))).filter(Boolean).sort();

    const modelos = Array.from(new Set(clientesDataCache.map(cliente =>
      cliente.modelo))).filter(Boolean).sort();

    const años = Array.from(new Set(clientesDataCache.map(cliente =>
      cliente.año.toString()))).filter(Boolean).sort((a, b) => Number(b) - Number(a));

    const paquetes = Array.from(new Set(clientesDataCache.map(cliente =>
      cliente.paquete !== undefined ? cliente.paquete : 'null'
    ))).filter(Boolean).sort();

    const asesores = Array.from(new Set(clientesDataCache.map(cliente =>
      cliente.aps))).filter((asesor): asesor is string =>
        asesor !== undefined && asesor !== null).sort();

    return {
      agencias,
      modelos,
      años,
      paquetes,
      asesores
    };
  } catch (error) {
    console.error('Error al obtener metadatos de filtros:', error);
    throw error;
  }
};

// Función actualizada para limpiar la caché 
export const limpiarCacheCSV = async (): Promise<void> => {
  clientesDataCache = null;
  todosCargados = false;

  // Invalidar también la caché en el servidor
  try {
    // Asegúrate de que esta URL es correcta
    const response = await fetch(`${API_URL}/cache/invalidate/${agenciaActual}`, {
      method: 'POST'
    });

    if (!response.ok) {
      console.error(`Error al invalidar caché en servidor: ${response.statusText}`);
    } else {
      console.log('Caché de datos limpiada en cliente y servidor');
    }
  } catch (error) {
    console.error('Error al comunicarse con el servidor para invalidar caché:', error);
  }
};

// Función existente para obtener todas las agencias 
export const obtenerTodasAgencias = async (agencia?: AgenciaNombre): Promise<string[]> => {
  try {
    // Si se especifica una agencia, establecerla
    if (agencia) {
      establecerAgenciaActual(agencia);
    }

    // Si no tenemos los datos en caché, los cargamos
    if (!clientesDataCache || !todosCargados) {
      await obtenerClientesPaginados(1, 1, true);
      todosCargados = true;
    }

    if (!clientesDataCache) {
      throw new Error('No se pudieron cargar los datos');
    }

    // Extraer todas las agencias únicas
    const agenciasSet = new Set<string>();
    clientesDataCache.forEach(cliente => {
      if (cliente.agencia && cliente.agencia.trim()) {
        agenciasSet.add(cliente.agencia.trim());
      }
    });

    const agencias = Array.from(agenciasSet).sort();
    console.log(`Obtenidas ${agencias.length} agencias únicas`);

    return agencias;
  } catch (error) {
    console.error('Error al obtener todas las agencias:', error);
    return [];
  }
};

// Mantener esta función para compatibilidad con código existente
export const cargarDatosCSV = async (agencia?: AgenciaNombre): Promise<Cliente[]> => {
  try {
    console.log('Solicitud para cargar todos los datos');

    // Si se especifica una agencia, establecerla
    if (agencia) {
      establecerAgenciaActual(agencia);
    }

    // Si tenemos los datos en caché, los devolvemos directamente
    if (clientesDataCache && todosCargados) {
      console.log('Devolviendo datos en caché completos');
      return clientesDataCache;
    }

    // Si no hay caché, cargar datos desde el servidor
    await obtenerClientesPaginados(1, 1, true);

    if (!clientesDataCache) {
      throw new Error('No se pudieron cargar los datos');
    }

    return clientesDataCache;
  } catch (error) {
    console.error('Error en cargarDatosCSV:', error);
    throw error;
  }
};

console.log('Servicio de datos iniciado - Usando conexión a servidor proxy');