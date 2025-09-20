// scripts/seedData.ts
// Script para cargar datos de prueba en todas las APIs del proyecto

import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { mockData } from './mockData';

// Configuración del servidor
const BASE_URL = 'https://platform-telemed-dev.uc.r.appspot.com';
const API_BASE = `${BASE_URL}/api`;

// Cliente HTTP configurado
const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Colores para logs
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Configuración de logging a archivo
const LOG_DIR = path.join(__dirname, 'logs');
const LOG_FILE = path.join(LOG_DIR, `seed-log-${new Date().toISOString().split('T')[0]}-${Date.now()}.txt`);

// Crear directorio de logs si no existe
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Función para escribir al archivo de log
const writeToLogFile = (message: string) => {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(LOG_FILE, logEntry, 'utf8');
};

// Función para loggear respuestas de API
const logApiResponse = (endpoint: string, method: string, status: number, data: any, error?: any) => {
  const logData = {
    timestamp: new Date().toISOString(),
    endpoint,
    method,
    status,
    success: status >= 200 && status < 300,
    data: data || null,
    error: error ? {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    } : null
  };
  
  const logMessage = `API_RESPONSE: ${JSON.stringify(logData, null, 2)}`;
  writeToLogFile(logMessage);
  writeToLogFile('---'.repeat(20)); // Separador
};

const log = {
  info: (msg: string) => {
    console.log(`${colors.blue}ℹ ${msg}${colors.reset}`);
    writeToLogFile(`INFO: ${msg}`);
  },
  success: (msg: string) => {
    console.log(`${colors.green}✅ ${msg}${colors.reset}`);
    writeToLogFile(`SUCCESS: ${msg}`);
  },
  error: (msg: string) => {
    console.log(`${colors.red}❌ ${msg}${colors.reset}`);
    writeToLogFile(`ERROR: ${msg}`);
  },
  warning: (msg: string) => {
    console.log(`${colors.yellow}⚠️ ${msg}${colors.reset}`);
    writeToLogFile(`WARNING: ${msg}`);
  },
  title: (msg: string) => {
    console.log(`${colors.magenta}🚀 ${msg}${colors.reset}`);
    writeToLogFile(`TITLE: ${msg}`);
  }
};

// Función para verificar si el servidor está corriendo
async function checkServerHealth(): Promise<boolean> {
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

// Función para crear usuarios
async function seedUsers() {
  log.title('Creando Usuarios...');
  
  for (const user of mockData.users) {
    try {
      const response = await api.post('/users', user);
      logApiResponse('/users', 'POST', response.status, response.data);
      log.success(`Usuario creado: ${user.name} (ID: ${response.data.data?.id || 'generado'})`);
    } catch (error: any) {
      logApiResponse('/users', 'POST', error.response?.status || 0, null, error);
      if (error.response?.status === 409) {
        log.warning(`Usuario ya existe: ${user.name}`);
      } else {
        log.error(`Error creando usuario ${user.name}: ${error.message}`);
      }
    }
  }
}

// Función para crear recicladores
async function seedRecyclers() {
  log.title('Creando Recicladores...');
  
  for (const recycler of mockData.recyclers) {
    try {
      const response = await api.post('/recyclers', recycler);
      logApiResponse('/recyclers', 'POST', response.status, response.data);
      log.success(`Reciclador creado: ${recycler.infoBase.nombre} (ID: ${recycler.id})`);
    } catch (error: any) {
      logApiResponse('/recyclers', 'POST', error.response?.status || 0, null, error);
      if (error.response?.status === 409) {
        log.warning(`Reciclador ya existe: ${recycler.infoBase.nombre}`);
      } else {
        log.error(`Error creando reciclador ${recycler.infoBase.nombre}: ${error.message}`);
      }
    }
  }
}

// Función para crear ubicaciones
async function seedLocations() {
  log.title('Creando Ubicaciones...');
  
  for (const location of mockData.locations) {
    try {
      const response = await api.post('/locations', location);
      logApiResponse('/locations', 'POST', response.status, response.data);
      log.success(`Ubicación creada: ${location.nombre} (${location.ciudad})`);
    } catch (error: any) {
      logApiResponse('/locations', 'POST', error.response?.status || 0, null, error);
      if (error.response?.status === 409) {
        log.warning(`Ubicación ya existe: ${location.nombre}`);
      } else {
        log.error(`Error creando ubicación ${location.nombre}: ${error.message}`);
      }
    }
  }
}

// NOTA: No existe endpoint POST para crear cupones
// Solo existe GET /coupons para listar cupones existentes
// Los cupones se crean directamente en Firebase o por admin
async function seedCoupons() {
  log.title('Verificando Cupones Existentes...');
  
  try {
    const response = await api.get('/coupons');
    logApiResponse('/coupons', 'GET', response.status, response.data);
    
    if (response.data && response.data.data) {
      log.success(`Cupones encontrados: ${response.data.data.length} cupones disponibles`);
      response.data.data.forEach((coupon: any) => {
        log.info(`- ${coupon.titulo} (${coupon.costoCreditosRequeridos} créditos)`);
      });
    } else {
      log.warning('No se encontraron cupones en el sistema');
    }
  } catch (error: any) {
    logApiResponse('/coupons', 'GET', error.response?.status || 0, null, error);
    log.error(`Error obteniendo cupones: ${error.message}`);
  }
}

// Función para crear citas
async function seedAppointments() {
  log.title('Creando Citas...');
  
  for (const appointment of mockData.appointments) {
    try {
      const response = await api.post('/appointments', appointment);
      logApiResponse('/appointments', 'POST', response.status, response.data);
      log.success(`Cita creada: ${appointment.clienteId} -> ${appointment.recicladorId} (${appointment.fecha})`);
    } catch (error: any) {
      logApiResponse('/appointments', 'POST', error.response?.status || 0, null, error);
      if (error.response?.status === 409) {
        log.warning(`Cita ya existe para: ${appointment.clienteId}`);
      } else {
        log.error(`Error creando cita: ${error.message}`);
      }
    }
  }
}

// Función para crear reseñas
async function seedReviews() {
  log.title('Creando Reseñas...');
  
  for (const review of mockData.reviews) {
    try {
      const endpoint = `/recyclers/${review.recicladorId}/reviews`;
      const reviewData = {
        usuarioId: review.usuarioId,
        calificacion: review.calificacion,
        comentario: review.comentario
      };
      const response = await api.post(endpoint, reviewData);
      logApiResponse(endpoint, 'POST', response.status, response.data);
      log.success(`Reseña creada: ${review.calificacion}⭐ para reciclador ${review.recicladorId}`);
    } catch (error: any) {
      logApiResponse(`/recyclers/${review.recicladorId}/reviews`, 'POST', error.response?.status || 0, null, error);
      if (error.response?.status === 409) {
        log.warning(`Reseña ya existe para reciclador: ${review.recicladorId}`);
      } else {
        log.error(`Error creando reseña: ${error.message}`);
      }
    }
  }
}

// Función para asignar rutas de transporte
async function seedTransportRoutes() {
  log.title('Creando Rutas de Transporte...');
  
  for (const route of mockData.transportRoutes) {
    try {
      const endpoint = `/transport/recycler/${route.recicladorId}`;
      const routeData = {
        puntos: route.puntos,
        tipoVehiculo: route.tipoVehiculo,
        capacidadMaxima: route.capacidadMaxima
      };
      const response = await api.post(endpoint, routeData);
      logApiResponse(endpoint, 'POST', response.status, response.data);
      log.success(`Ruta creada para reciclador: ${route.recicladorId} (${route.puntos.length} puntos)`);
    } catch (error: any) {
      logApiResponse(`/transport/recycler/${route.recicladorId}`, 'POST', error.response?.status || 0, null, error);
      if (error.response?.status === 409) {
        log.warning(`Ruta ya existe para reciclador: ${route.recicladorId}`);
      } else {
        log.error(`Error creando ruta: ${error.message}`);
      }
    }
  }
}

// Función principal
async function main() {
  console.log(`${colors.cyan}
╔══════════════════════════════════════════════════════════════╗
║                    CICLO VIDA - SEED DATA                    ║
║              Cargando datos de prueba en APIs                ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}`);

  // Inicializar log
  log.info(`Archivo de log creado: ${LOG_FILE}`);
  writeToLogFile('='.repeat(80));
  writeToLogFile('CICLO VIDA - SEED DATA - INICIO DE EJECUCIÓN');
  writeToLogFile('='.repeat(80));

  // Verificar que el servidor esté corriendo
  log.info('Verificando conexión con el servidor...');
  const isServerRunning = await checkServerHealth();
  
  if (!isServerRunning) {
    log.error('El servidor no está corriendo. Inicia el servidor con: npm run dev');
    process.exit(1);
  }
  
  log.success('Servidor conectado correctamente');
  console.log('');

  try {
    // Ejecutar seeding en orden lógico
    await seedUsers(); // Ahora existe la API
    console.log('');
    
    await seedRecyclers();
    console.log('');
    
    await seedLocations();
    console.log('');
    
    await seedCoupons(); // Solo verifica cupones existentes
    console.log('');
    
    await seedAppointments();
    console.log('');
    
    await seedReviews();
    console.log('');
    
    await seedTransportRoutes();
    console.log('');

    log.success('🎉 ¡Todos los datos de prueba han sido cargados exitosamente!');
    
    // Log final
    writeToLogFile('='.repeat(80));
    writeToLogFile('CICLO VIDA - SEED DATA - EJECUCIÓN COMPLETADA EXITOSAMENTE');
    writeToLogFile('='.repeat(80));
    log.info(`📄 Log completo guardado en: ${LOG_FILE}`);
    
  } catch (error) {
    log.error(`Error general en el proceso de seeding: ${error}`);
    writeToLogFile('='.repeat(80));
    writeToLogFile('CICLO VIDA - SEED DATA - EJECUCIÓN TERMINADA CON ERROR');
    writeToLogFile(`ERROR: ${error}`);
    writeToLogFile('='.repeat(80));
    process.exit(1);
  }
}

// Ejecutar script
if (require.main === module) {
  main().catch(error => {
    log.error(`Error fatal: ${error.message}`);
    process.exit(1);
  });
}

export { main as seedData };
