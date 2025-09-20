# 🌱 Scripts de Carga de Datos - Ciclo Vida

Este directorio contiene scripts para cargar datos de prueba en todas las APIs del proyecto Ciclo Vida.

## 📁 Archivos

- **`seedData.ts`** - Script principal para cargar datos
- **`mockData.ts`** - Datos de prueba estructurados
- **`README.md`** - Esta documentación

## 🚀 Uso Rápido

### 1. Iniciar el Servidor
```bash
npm run dev
```

### 2. Ejecutar Script de Carga (en otra terminal)
```bash
npm run seed
```

## 📊 Datos que se Cargan

### ⚠️ **Usuarios (NO SE CREAN)**
- **API no disponible**: No existe endpoint `POST /api/users`
- **Gestión**: Los usuarios se manejan via Firebase Auth o admin
- **IDs utilizados**: `user_001`, `user_002`, etc. (deben existir previamente)

### ♻️ **Recicladores (3 recicladores)**
- **Ana Martínez - EcoReciclaje**
  - Zonas: Chapinero, Zona Rosa
  - Especialidad: Papel, Cartón, Plástico, Vidrio
  
- **Pedro Sánchez - Verde Limpio**
  - Zonas: Suba, Engativá
  - Especialidad: Metal, Electrónicos, Papel, Cartón, Plástico
  
- **EcoCenter Bogotá**
  - Zonas: La Candelaria, Centro
  - Especialidad: Orgánico, Papel, Cartón, Textil

### 📍 **Ubicaciones (4 ubicaciones)**
- Chapinero Norte
- Zona Rosa
- Suba Centro
- La Candelaria

### 🎫 **Cupones (SOLO CONSULTA)**
- **API disponible**: Solo `GET /api/coupons` (listar existentes)
- **No se crean**: Los cupones se gestionan por admin/Firebase
- **Verificación**: El script lista cupones disponibles en el sistema

### 📅 **Citas (5 citas)**
- Todas en estado "pendiente"
- Fechas programadas para febrero 2024
- Diferentes tipos de materiales

### ⭐ **Reseñas (6 reseñas)**
- Calificaciones de 3 a 5 estrellas
- Comentarios realistas de usuarios

### 🚛 **Rutas de Transporte (3 rutas)**
- Rutas optimizadas por reciclador
- Diferentes tipos de vehículos
- Capacidades variables

## 🔧 Configuración

### Servidor Base
```typescript
const BASE_URL = 'http://localhost:3000';
```

### Endpoints Utilizados
- ❌ `POST /api/users` - **NO EXISTE** (usuarios via Firebase Auth)
- ✅ `POST /api/recyclers` - Crear recicladores
- ✅ `POST /api/locations` - Crear ubicaciones
- ❌ `POST /api/coupons` - **NO EXISTE** (solo GET para listar)
- ✅ `GET /api/coupons` - Listar cupones existentes
- ✅ `POST /api/appointments` - Crear citas
- ✅ `POST /api/recyclers/:id/reviews` - Crear reseñas
- ✅ `POST /api/transport/recycler/:id` - Crear rutas

## 📋 Orden de Ejecución (Actualizado)

1. **Recicladores** - Base para citas y reseñas
2. **Ubicaciones** - Puntos geográficos
3. **Cupones** - Solo verificación (GET)
4. **Citas** - Solicitudes de recolección
5. **Reseñas** - Calificaciones de servicio
6. **Rutas de Transporte** - Optimización logística

⚠️ **Nota**: Los usuarios deben existir previamente en Firebase Auth

## ✅ Validaciones

- ✅ Verifica que el servidor esté corriendo
- ✅ Maneja errores de duplicados (409)
- ✅ Maneja endpoints no encontrados (404)
- ✅ Logs coloridos y descriptivos
- ✅ Timeout de 10 segundos por request
- ✅ **Logging completo en archivo TXT** con todas las respuestas de APIs

## 🎨 Salida del Script (Actualizada)

```
🚀 CICLO VIDA - SEED DATA
   Cargando datos de prueba en APIs

ℹ Archivo de log creado: /path/to/logs/seed-log-2024-02-15-*.txt
ℹ Verificando conexión con el servidor...
✅ Servidor conectado correctamente

🚀 Creando Recicladores...
✅ Reciclador creado: Ana Martínez - EcoReciclaje (ID: recycler_001)
✅ Reciclador creado: Pedro Sánchez - Verde Limpio (ID: recycler_002)

🚀 Creando Ubicaciones...
✅ Ubicación creada: Chapinero Norte (Bogotá)

🚀 Verificando Cupones Existentes...
✅ Cupones encontrados: 4 cupones disponibles
ℹ - Descuento Supermercado Éxito (150 créditos)

🚀 Creando Citas...
✅ Cita creada: user_001 -> recycler_001

🎉 ¡Todos los datos de prueba han sido cargados exitosamente!
📄 Log completo guardado en: /path/to/logs/seed-log-2024-02-15-*.txt
```

## 🔄 Re-ejecución

El script maneja duplicados automáticamente:
- ⚠️ **Advertencia** para registros existentes
- ❌ **Error** para problemas reales
- ✅ **Éxito** para nuevos registros

## 🛠️ Personalización

### Modificar Datos
Edita `mockData.ts` para cambiar:
- Cantidad de registros
- Información específica
- Relaciones entre entidades

### Agregar Nuevos Endpoints
En `seedData.ts` agrega nuevas funciones:
```typescript
async function seedNuevoModulo() {
  log.title('Creando Nuevo Módulo...');
  // Lógica aquí
}
```

### Cambiar URL del Servidor
```typescript
const BASE_URL = 'https://tu-servidor.com';
```

## 🚨 Troubleshooting

### Error: "El servidor no está corriendo"
```bash
# Terminal 1: Iniciar servidor
npm run dev

# Terminal 2: Ejecutar seed
npm run seed
```

### Error: "Endpoint no encontrado"
- Verifica que las rutas estén implementadas
- Revisa el archivo de rutas correspondiente

### Error: "Timeout"
- Verifica conexión a internet
- Aumenta el timeout en `seedData.ts`

## 📝 Notas

- **Una sola ejecución**: Diseñado para ejecutarse una vez
- **Datos realistas**: Información coherente y útil para testing
- **Independiente**: No afecta el código principal del proyecto
- **Extensible**: Fácil agregar nuevos módulos

## 📄 Sistema de Logging Avanzado

### 🗂️ **Archivos de Log Automáticos**
- **Ubicación**: `scripts/logs/`
- **Formato**: `seed-log-YYYY-MM-DD-timestamp.txt`
- **Ejemplo**: `seed-log-2024-02-15-1708012345678.txt`

### 📊 **Contenido del Log**

#### **Información General**
```
[2024-02-15T10:30:45.123Z] INFO: Archivo de log creado: /path/to/logs/seed-log-2024-02-15-1708012345678.txt
[2024-02-15T10:30:45.124Z] TITLE: Creando Usuarios...
[2024-02-15T10:30:45.125Z] SUCCESS: Usuario creado: María González (ID: user_001)
```

#### **Respuestas Completas de APIs**
```json
API_RESPONSE: {
  "timestamp": "2024-02-15T10:30:45.567Z",
  "endpoint": "/users",
  "method": "POST",
  "status": 201,
  "success": true,
  "data": {
    "id": "user_001",
    "name": "María González",
    "email": "maria.gonzalez@email.com",
    "createdAt": "2024-02-15T10:30:45.000Z"
  },
  "error": null
}
------------------------------------------------------------
```

#### **Errores Detallados**
```json
API_RESPONSE: {
  "timestamp": "2024-02-15T10:30:46.123Z",
  "endpoint": "/coupons",
  "method": "POST",
  "status": 404,
  "success": false,
  "data": null,
  "error": {
    "message": "Request failed with status code 404",
    "status": 404,
    "statusText": "Not Found",
    "data": {
      "error": "Endpoint not implemented"
    }
  }
}
```

### 🎯 **Beneficios del Logging**

1. **Debugging Avanzado** - Ver respuestas exactas de cada API
2. **Auditoría Completa** - Registro de todas las operaciones
3. **Análisis de Errores** - Detalles completos de fallos
4. **Historial Persistente** - Logs guardados para revisión posterior
5. **Desarrollo de APIs** - Verificar formato de respuestas

### 📁 **Estructura de Logs**
```
scripts/
├── logs/
│   ├── seed-log-2024-02-15-1708012345678.txt
│   ├── seed-log-2024-02-14-1707926123456.txt
│   └── ...
├── seedData.ts
├── mockData.ts
└── README.md
```

### 🔍 **Análisis de Logs**

#### **Buscar Errores Específicos**
```bash
# Buscar todos los errores 404
grep -n "404" scripts/logs/seed-log-*.txt

# Buscar respuestas exitosas de usuarios
grep -A 10 -B 2 "endpoint.*users" scripts/logs/seed-log-*.txt
```

#### **Verificar APIs Implementadas**
```bash
# Ver qué endpoints respondieron exitosamente
grep -n "success.*true" scripts/logs/seed-log-*.txt
```

### ⚙️ **Configuración Automática**
- ✅ **Directorio automático** - Se crea `scripts/logs/` si no existe
- ✅ **Nombres únicos** - Timestamp evita sobreescritura
- ✅ **Formato JSON** - Respuestas estructuradas para análisis
- ✅ **Separadores visuales** - Fácil lectura manual
- ✅ **Gitignore incluido** - No se suben logs al repositorio

¡Perfecto para desarrollo, testing y demos! 🎯
