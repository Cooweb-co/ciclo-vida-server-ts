// scripts/clearData.ts
// Script para limpiar todos los datos de prueba (USAR CON PRECAUCIÓN)

import axios from 'axios';
import { mockData } from './mockData';
import { IUser } from '../src/types/user.types';

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

const log = {
  info: (msg: string) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  success: (msg: string) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg: string) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg: string) => console.log(`${colors.yellow}⚠️ ${msg}${colors.reset}`),
  title: (msg: string) => console.log(`${colors.magenta}🧹 ${msg}${colors.reset}`)
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

// Función para confirmar la eliminación
function askForConfirmation(): Promise<boolean> {
  return new Promise((resolve) => {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log(`${colors.red}⚠️ ADVERTENCIA: Este script eliminará TODOS los datos de prueba.${colors.reset}`);
    console.log(`${colors.yellow}Esto incluye usuarios, recicladores, citas, reseñas, etc.${colors.reset}`);
    console.log('');
    
    rl.question('¿Estás seguro de que quieres continuar? (escriba "SI" para confirmar): ', (answer) => {
      rl.close();
      resolve(answer.toUpperCase() === 'SI');
    });
  });
}

// Función para eliminar usuarios
async function clearUsers() {
  log.title('Eliminando Usuarios...');
  
  try {
    // Primero obtener todos los usuarios
    const response = await api.get('/users');
    const users: IUser[] = response.data.data || [];
    
    if (Array.isArray(users) && users.length > 0) {
      for (const user of users) {
        try {
          await api.delete(`/users/${user.id}`);
          log.success(`Usuario eliminado: ${user.name} (ID: ${user.id})`);
        } catch (error: any) {
          if (error.response?.status === 404) {
            log.warning(`Usuario no encontrado: ${user.name}`);
          } else {
            log.error(`Error eliminando usuario ${user.name}: ${error.message}`);
          }
        }
      }
    } else {
      log.warning('No se encontraron usuarios para eliminar');
    }
  } catch (error: any) {
    if (error.response?.status === 404) {
      log.warning('Endpoint de usuarios no encontrado o no hay usuarios');
    } else {
      log.error(`Error obteniendo usuarios: ${error.message}`);
    }
  }
}

// Función para eliminar recicladores
async function clearRecyclers() {
  log.title('Eliminando Recicladores...');
  
  for (const recycler of mockData.recyclers) {
    try {
      await api.delete(`/recyclers/${recycler.id}`);
      log.success(`Reciclador eliminado: ${recycler.infoBase.nombre} (ID: ${recycler.id})`);
    } catch (error: any) {
      if (error.response?.status === 404) {
        log.warning(`Reciclador no encontrado: ${recycler.infoBase.nombre}`);
      } else {
        log.error(`Error eliminando reciclador ${recycler.infoBase.nombre}: ${error.message}`);
      }
    }
  }
}

// Función para eliminar citas
async function clearAppointments() {
  log.title('Eliminando Citas...');
  
  try {
    // Primero obtener todas las citas
    const response = await api.get('/appointments');
    const appointments = response.data;
    
    if (Array.isArray(appointments)) {
      for (const appointment of appointments) {
        try {
          await api.delete(`/appointments/${appointment.id}`);
          log.success(`Cita eliminada: ${appointment.id}`);
        } catch (error: any) {
          log.error(`Error eliminando cita ${appointment.id}: ${error.message}`);
        }
      }
    }
  } catch (error: any) {
    log.error(`Error obteniendo citas: ${error.message}`);
  }
}

// Función para eliminar cupones
async function clearCoupons() {
  log.title('Eliminando Cupones...');
  
  for (const coupon of mockData.coupons) {
    try {
      await api.delete(`/coupons/${coupon.id}`);
      log.success(`Cupón eliminado: ${coupon.titulo} (ID: ${coupon.id})`);
    } catch (error: any) {
      if (error.response?.status === 404) {
        log.warning(`Cupón no encontrado o endpoint no disponible: ${coupon.titulo}`);
      } else {
        log.error(`Error eliminando cupón ${coupon.titulo}: ${error.message}`);
      }
    }
  }
}

// Función principal
async function main() {
  console.log(`${colors.cyan}
╔══════════════════════════════════════════════════════════════╗
║                    CICLO VIDA - CLEAR DATA                   ║
║              Eliminando datos de prueba                      ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}`);

  // Verificar que el servidor esté corriendo
  log.info('Verificando conexión con el servidor...');
  const isServerRunning = await checkServerHealth();
  
  if (!isServerRunning) {
    log.error('El servidor no está corriendo. Inicia el servidor con: npm run dev');
    process.exit(1);
  }
  
  log.success('Servidor conectado correctamente');
  console.log('');

  // Pedir confirmación
  const confirmed = await askForConfirmation();
  
  if (!confirmed) {
    log.info('Operación cancelada por el usuario.');
    process.exit(0);
  }

  console.log('');
  log.info('Iniciando eliminación de datos...');
  console.log('');

  try {
    // Ejecutar eliminación en orden inverso al seeding
    await clearAppointments();
    console.log('');
    
    await clearCoupons();
    console.log('');
    
    await clearRecyclers();
    console.log('');
    
    await clearUsers();
    console.log('');

    log.success('🎉 ¡Todos los datos de prueba han sido eliminados exitosamente!');
    
  } catch (error) {
    log.error(`Error general en el proceso de limpieza: ${error}`);
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

export { main as clearData };
