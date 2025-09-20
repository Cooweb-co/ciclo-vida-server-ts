// scripts/mockData.ts
// Datos de prueba para todas las APIs del proyecto

import { Timestamp } from 'firebase/firestore';

// Función helper para crear timestamps
const createTimestamp = (dateString: string): Timestamp => {
  return Timestamp.fromDate(new Date(dateString));
};

// Usuarios
export const mockUsers = [
  {
    name: 'María González',
    email: 'maria.gonzalez@email.com',
    phone: '+57 300 123 4567',
    address: 'Calle 72 #10-34, Chapinero, Bogotá',
    coordinates: { lat: 4.6533, lng: -74.0836 },
    avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150'
  },
  {
    name: 'Carlos Rodríguez',
    email: 'carlos.rodriguez@email.com',
    phone: '+57 301 234 5678',
    address: 'Carrera 15 #85-20, Zona Rosa, Bogotá',
    coordinates: { lat: 4.6697, lng: -74.0648 },
    avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150'
  },
  {
    name: 'Ana Martínez',
    email: 'ana.martinez@email.com',
    phone: '+57 302 345 6789',
    address: 'Carrera 7 #45-20, Centro, Bogotá',
    coordinates: { lat: 4.6097, lng: -74.0817 },
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150'
  },
  {
    name: 'Pedro Sánchez',
    email: 'pedro.sanchez@email.com',
    phone: '+57 303 456 7890',
    address: 'Calle 127 #15-28, Suba, Bogotá',
    coordinates: { lat: 4.7110, lng: -74.0721 },
    avatar: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150'
  },
  {
    name: 'Laura Jiménez',
    email: 'laura.jimenez@email.com',
    phone: '+57 304 567 8901',
    address: 'Carrera 68 #75-45, Engativá, Bogotá',
    coordinates: { lat: 4.6951, lng: -74.1245 },
    avatar: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=150'
  }
];

// Recicladores
export const mockRecyclers = [
  {
    id: 'recycler_001',
    zonasCobertura: [
      { lat: 4.6533, lng: -74.0836, radio: 2000 }, // Chapinero
      { lat: 4.6697, lng: -74.0648, radio: 1500 }  // Zona Rosa
    ],
    infoBase: {
      nombre: 'Ana Martínez - EcoReciclaje',
      telefono: '+57 302 345 6789',
      email: 'ana.martinez@email.com',
      descripcion: 'Recicladora con 5 años de experiencia. Especializada en papel, cartón y plásticos. Servicio confiable y puntual.',
      tiposResiduos: ['Papel', 'Cartón', 'Plástico', 'Vidrio'],
      horarioAtencion: '07:00 - 17:00',
      sitioWeb: 'https://ecoreciclaje-ana.com'
    },
    fechaCreacion: new Date('2023-08-10T09:00:00Z'),
    fechaActualizacion: new Date('2024-01-15T10:00:00Z'),
    activo: true
  },
  {
    id: 'recycler_002',
    zonasCobertura: [
      { lat: 4.7110, lng: -74.0721, radio: 3000 }, // Suba
      { lat: 4.6951, lng: -74.1245, radio: 2500 }  // Engativá
    ],
    infoBase: {
      nombre: 'Pedro Sánchez - Verde Limpio',
      telefono: '+57 303 456 7890',
      email: 'pedro.sanchez@email.com',
      descripcion: 'Reciclador comprometido con el medio ambiente. Trabajo con todo tipo de materiales. Servicio 24/7.',
      tiposResiduos: ['Metal', 'Electrónicos', 'Papel', 'Cartón', 'Plástico'],
      horarioAtencion: '06:00 - 18:00',
      sitioWeb: 'https://verdelimpio.co'
    },
    fechaCreacion: new Date('2023-11-05T11:15:00Z'),
    fechaActualizacion: new Date('2024-01-20T09:30:00Z'),
    activo: true
  },
  {
    id: 'recycler_003',
    zonasCobertura: [
      { lat: 4.6097, lng: -74.0817, radio: 2200 }, // La Candelaria
      { lat: 4.5981, lng: -74.0758, radio: 1800 }  // Centro
    ],
    infoBase: {
      nombre: 'EcoCenter Bogotá',
      telefono: '+57 301 234 5678',
      email: 'info@ecocenter.com',
      descripcion: 'Centro de reciclaje especializado en materiales orgánicos y compostaje. Educación ambiental incluida.',
      tiposResiduos: ['Orgánico', 'Papel', 'Cartón', 'Textil'],
      horarioAtencion: '08:00 - 16:00',
      sitioWeb: 'https://ecocenter-bogota.com'
    },
    fechaCreacion: new Date('2023-06-15T14:20:00Z'),
    fechaActualizacion: new Date('2024-01-18T11:45:00Z'),
    activo: true
  }
];

// Ubicaciones
export const mockLocations = [
  {
    nombre: 'Chapinero Norte',
    ciudad: 'Bogotá',
    departamento: 'Cundinamarca',
    coordenadas: { lat: 4.6533, lng: -74.0836 },
    codigoPostal: '110231',
    activo: true
  },
  {
    nombre: 'Zona Rosa',
    ciudad: 'Bogotá', 
    departamento: 'Cundinamarca',
    coordenadas: { lat: 4.6697, lng: -74.0648 },
    codigoPostal: '110221',
    activo: true
  },
  {
    nombre: 'Suba Centro',
    ciudad: 'Bogotá',
    departamento: 'Cundinamarca', 
    coordenadas: { lat: 4.7110, lng: -74.0721 },
    codigoPostal: '111121',
    activo: true
  },
  {
    nombre: 'La Candelaria',
    ciudad: 'Bogotá',
    departamento: 'Cundinamarca',
    coordenadas: { lat: 4.6097, lng: -74.0817 },
    codigoPostal: '110311',
    activo: true
  }
];

// Cupones
export const mockCoupons = [
  {
    id: 'coupon_001',
    titulo: 'Descuento Supermercado Éxito',
    descripcion: '20% de descuento en productos de la canasta familiar',
    costoCreditosRequeridos: 150,
    categoria: 'Alimentación',
    empresa: 'Grupo Éxito',
    porcentajeDescuento: 20,
    fechaVencimiento: new Date('2024-12-31T23:59:59Z'),
    imagenUrl: 'https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg?auto=compress&cs=tinysrgb&w=300',
    terminosCondiciones: 'Válido para compras superiores a $50.000. No acumulable con otras promociones.',
    cantidadDisponible: 100,
    activo: true,
    fechaCreacion: new Date('2024-01-01T00:00:00Z'),
    fechaActualizacion: new Date('2024-01-01T00:00:00Z')
  },
  {
    id: 'coupon_002',
    titulo: 'Transporte Público Gratis',
    descripcion: '5 viajes gratis en TransMilenio',
    costoCreditosRequeridos: 80,
    categoria: 'Transporte',
    empresa: 'TransMilenio S.A.',
    valorDescuento: 12500,
    fechaVencimiento: new Date('2024-06-30T23:59:59Z'),
    imagenUrl: 'https://images.pexels.com/photos/1007025/pexels-photo-1007025.jpeg?auto=compress&cs=tinysrgb&w=300',
    terminosCondiciones: 'Válido en todas las rutas de TransMilenio. Presentar código QR.',
    cantidadDisponible: 200,
    activo: true,
    fechaCreacion: new Date('2024-01-01T00:00:00Z'),
    fechaActualizacion: new Date('2024-01-01T00:00:00Z')
  },
  {
    id: 'coupon_003',
    titulo: 'Cine Colombia - Entrada Gratis',
    descripcion: 'Entrada gratuita para cualquier función',
    costoCreditosRequeridos: 120,
    categoria: 'Entretenimiento',
    empresa: 'Cine Colombia',
    valorDescuento: 15000,
    fechaVencimiento: new Date('2024-08-31T23:59:59Z'),
    imagenUrl: 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=300',
    terminosCondiciones: 'Válido de lunes a jueves. No incluye funciones 3D o VIP.',
    cantidadDisponible: 50,
    activo: true,
    fechaCreacion: new Date('2024-01-01T00:00:00Z'),
    fechaActualizacion: new Date('2024-01-01T00:00:00Z')
  },
  {
    id: 'coupon_004',
    titulo: 'Restaurante Verde - 30% Off',
    descripcion: '30% de descuento en menú completo',
    costoCreditosRequeridos: 200,
    categoria: 'Gastronomía',
    empresa: 'Restaurante Verde',
    porcentajeDescuento: 30,
    fechaVencimiento: new Date('2024-09-30T23:59:59Z'),
    imagenUrl: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=300',
    terminosCondiciones: 'Válido para máximo 4 personas. Reserva previa requerida.',
    cantidadDisponible: 75,
    activo: true,
    fechaCreacion: new Date('2024-01-01T00:00:00Z'),
    fechaActualizacion: new Date('2024-01-01T00:00:00Z')
  }
];

// Citas/Appointments (sin estado - se asigna automáticamente como 'pendiente')
export const mockAppointments = [
  {
    clienteId: 'user_001',
    recicladorId: 'recycler_001',
    fecha: createTimestamp('2024-02-15T10:00:00Z'),
    direccion: 'Calle 72 #10-34, Chapinero, Bogotá',
    cantidadAproxMaterial: 15,
    descripcion: 'Cajas de cartón, periódicos y botellas plásticas de mudanza'
  },
  {
    clienteId: 'user_002',
    recicladorId: 'recycler_002',
    fecha: createTimestamp('2024-02-16T14:00:00Z'),
    direccion: 'Carrera 15 #85-20, Zona Rosa, Bogotá',
    cantidadAproxMaterial: 8,
    descripcion: 'Botellas de vidrio y latas de aluminio'
  },
  {
    clienteId: 'user_003',
    recicladorId: 'recycler_003',
    fecha: createTimestamp('2024-02-17T09:00:00Z'),
    direccion: 'Calle 11 #3-45, La Candelaria, Bogotá',
    cantidadAproxMaterial: 25,
    descripcion: 'Residuos orgánicos de restaurante y papel de oficina'
  },
  {
    clienteId: 'user_004',
    recicladorId: 'recycler_001',
    fecha: createTimestamp('2024-02-18T16:00:00Z'),
    direccion: 'Carrera 7 #63-44, Chapinero, Bogotá',
    cantidadAproxMaterial: 12,
    descripcion: 'Equipos electrónicos viejos y cables'
  },
  {
    clienteId: 'user_005',
    recicladorId: 'recycler_002',
    fecha: createTimestamp('2024-02-19T11:30:00Z'),
    direccion: 'Calle 127 #15-28, Suba, Bogotá',
    cantidadAproxMaterial: 20,
    descripcion: 'Cartón, papel y plásticos de oficina'
  }
];

// Reseñas/Reviews
export const mockReviews = [
  {
    recicladorId: 'recycler_001',
    usuarioId: 'user_001',
    calificacion: 5,
    comentario: 'Excelente servicio, muy puntual y amable. Ana llegó exactamente a la hora acordada y manejó todos los materiales con mucho cuidado. ¡Recomendado 100%!'
  },
  {
    recicladorId: 'recycler_001',
    usuarioId: 'user_004',
    calificacion: 4,
    comentario: 'Buen servicio, llegó a tiempo y fue muy profesional. Solo le faltó explicar mejor el proceso de reciclaje.'
  },
  {
    recicladorId: 'recycler_002',
    usuarioId: 'user_002',
    calificacion: 5,
    comentario: 'Pedro es increíble! Muy profesional y educado. Además me enseñó cómo separar mejor los residuos para futuras recolecciones.'
  },
  {
    recicladorId: 'recycler_002',
    usuarioId: 'user_005',
    calificacion: 4,
    comentario: 'Muy buen trabajo, solo llegó 15 minutos tarde pero el servicio fue excelente. Muy organizado.'
  },
  {
    recicladorId: 'recycler_003',
    usuarioId: 'user_003',
    calificacion: 5,
    comentario: 'EcoCenter es fantástico. No solo recogieron los residuos sino que me dieron tips sobre compostaje casero. Servicio integral.'
  },
  {
    recicladorId: 'recycler_003',
    usuarioId: 'user_001',
    calificacion: 3,
    comentario: 'Servicio correcto, aunque podría mejorar la comunicación previa. Llegaron sin avisar el cambio de horario.'
  }
];

// Rutas de Transporte
export const mockTransportRoutes = [
  {
    recicladorId: 'recycler_001',
    puntos: [
      { lat: 4.6533, lng: -74.0836, orden: 1, direccion: 'Calle 72 #10-34, Chapinero' },
      { lat: 4.6697, lng: -74.0648, orden: 2, direccion: 'Carrera 15 #85-20, Zona Rosa' },
      { lat: 4.6482, lng: -74.0776, orden: 3, direccion: 'Centro de Acopio Ana' }
    ],
    tipoVehiculo: 'Camión pequeño',
    capacidadMaxima: 500
  },
  {
    recicladorId: 'recycler_002',
    puntos: [
      { lat: 4.7110, lng: -74.0721, orden: 1, direccion: 'Calle 127 #15-28, Suba' },
      { lat: 4.6951, lng: -74.1245, orden: 2, direccion: 'Carrera 68 #75-45, Engativá' },
      { lat: 4.6800, lng: -74.0900, orden: 3, direccion: 'Centro Verde Limpio' }
    ],
    tipoVehiculo: 'Camión mediano',
    capacidadMaxima: 800
  },
  {
    recicladorId: 'recycler_003',
    puntos: [
      { lat: 4.6097, lng: -74.0817, orden: 1, direccion: 'Calle 11 #3-45, La Candelaria' },
      { lat: 4.5981, lng: -74.0758, orden: 2, direccion: 'Plaza de Bolívar' },
      { lat: 4.6050, lng: -74.0800, orden: 3, direccion: 'EcoCenter Bogotá' }
    ],
    tipoVehiculo: 'Bicicleta de carga',
    capacidadMaxima: 100
  }
];

// Exportar todos los datos
export const mockData = {
  users: mockUsers,
  recyclers: mockRecyclers,
  locations: mockLocations,
  coupons: mockCoupons,
  appointments: mockAppointments,
  reviews: mockReviews,
  transportRoutes: mockTransportRoutes
};
