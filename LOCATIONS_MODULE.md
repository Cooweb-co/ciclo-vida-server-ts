# Módulo de Ubicaciones - Ciclo Vida Server

## Descripción
Módulo completo para manejar puntos de entrega usando Express + TypeScript con Firebase Firestore y Google Maps API para cálculos de distancia.

## 🔑 Configuración de Google Maps API

### Ubicación de la API Key
La API Key de Google Maps se configura en: `src/config/googleMaps.config.ts`

```typescript
// 🔑 CONFIGURA TU API KEY DE GOOGLE MAPS AQUÍ
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || 'TU_API_KEY_AQUI';
```

### Cómo obtener una API Key de Google Maps:

1. **Ve a Google Cloud Console**: https://console.cloud.google.com/
2. **Crea un proyecto** o selecciona uno existente
3. **Habilita las APIs necesarias**:
   - Maps JavaScript API
   - Geocoding API
   - Places API (opcional)
4. **Ve a "Credenciales"** y crea una API Key
5. **Configura restricciones** según tus necesidades de seguridad
6. **Configura la API Key**:
   - **Opción 1 (Recomendada)**: Variable de entorno
     ```bash
     export GOOGLE_MAPS_API_KEY="tu_api_key_aqui"
     ```
   - **Opción 2**: Edita directamente el archivo `googleMaps.config.ts`

## Estructura de la Base de Datos

### Colección: `locations`
```typescript
{
  id: string;                    // Autogenerado por Firebase
  nombre: string;                // Nombre del punto de entrega
  lat: number;                   // Latitud
  lng: number;                   // Longitud
  tipo: TipoLocation;            // Tipo de ubicación
  fechaCreacion: Date;           // Timestamp de creación
  fechaActualizacion: Date;      // Timestamp de última actualización
  activo: boolean;               // Estado de la ubicación
}
```

### Tipos de Ubicación Disponibles:
```typescript
enum TipoLocation {
    BASURERO = 'basurero',
    CHATARRERIA = 'chatarreria',
    CENTRO_RECICLAJE = 'centro_reciclaje',
    PUNTO_LIMPIO = 'punto_limpio',
    CONTENEDOR = 'contenedor',
    OTRO = 'otro'
}
```

## Endpoints Disponibles

### 1. Validar Ubicación
**GET** `/api/locations/validate?lat=x&lng=y&radio=z`

Valida si un punto está registrado o está dentro de un radio específico.

**Parámetros de consulta:**
- `lat` (requerido): Latitud
- `lng` (requerido): Longitud
- `radio` (opcional): Radio en metros (default: 100, max: 10000)

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "nearbyLocations": [
      {
        "id": "location_123",
        "nombre": "Punto de Reciclaje Central",
        "lat": 4.6097,
        "lng": -74.0817,
        "tipo": "centro_reciclaje",
        "fechaCreacion": "2024-01-01T00:00:00.000Z",
        "fechaActualizacion": "2024-01-01T00:00:00.000Z",
        "activo": true
      }
    ],
    "closestLocation": {
      // Ubicación más cercana
    },
    "distance": 85.5
  },
  "searchParams": {
    "lat": 4.6097,
    "lng": -74.0817,
    "radio": 100
  }
}
```

### 2. Listar Todas las Ubicaciones
**GET** `/api/locations?tipo=basurero`

**Parámetros de consulta:**
- `tipo` (opcional): Filtrar por tipo de ubicación

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "location_123",
      "nombre": "Punto de Reciclaje Central",
      "lat": 4.6097,
      "lng": -74.0817,
      "tipo": "centro_reciclaje",
      "fechaCreacion": "2024-01-01T00:00:00.000Z",
      "fechaActualizacion": "2024-01-01T00:00:00.000Z",
      "activo": true
    }
  ],
  "count": 1
}
```

### 3. Registrar Nuevo Punto
**POST** `/api/locations`

**Body:**
```json
{
  "nombre": "Chatarrería El Progreso",
  "lat": 4.6097,
  "lng": -74.0817,
  "tipo": "chatarreria"
}
```

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "message": "Ubicación creada exitosamente",
  "data": {
    "id": "generated_id_123",
    "nombre": "Chatarrería El Progreso",
    "lat": 4.6097,
    "lng": -74.0817,
    "tipo": "chatarreria",
    "fechaCreacion": "2024-01-01T00:00:00.000Z",
    "fechaActualizacion": "2024-01-01T00:00:00.000Z",
    "activo": true
  }
}
```

### 4. Eliminar Punto
**DELETE** `/api/locations/:id`

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Ubicación eliminada exitosamente"
}
```

### 5. Obtener Ubicación por ID
**GET** `/api/locations/:id`

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "id": "location_123",
    "nombre": "Punto de Reciclaje Central",
    "lat": 4.6097,
    "lng": -74.0817,
    "tipo": "centro_reciclaje",
    "fechaCreacion": "2024-01-01T00:00:00.000Z",
    "fechaActualizacion": "2024-01-01T00:00:00.000Z",
    "activo": true
  }
}
```

### 6. Buscar en Área Específica
**GET** `/api/locations/search/area?lat=x&lng=y&radius=z`

**Parámetros de consulta:**
- `lat` (requerido): Latitud del centro
- `lng` (requerido): Longitud del centro
- `radius` (requerido): Radio en metros

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": [
    // Ubicaciones ordenadas por distancia (más cercanas primero)
  ],
  "count": 3,
  "searchParams": {
    "lat": 4.6097,
    "lng": -74.0817,
    "radius": 5000
  }
}
```

## Validaciones Implementadas

### Crear Ubicación:
- `nombre`: Requerido, 2-100 caracteres
- `lat`: Requerido, número entre -90 y 90
- `lng`: Requerido, número entre -180 y 180
- `tipo`: Requerido, debe ser uno de los tipos válidos

### Validar Ubicación:
- `lat` y `lng`: Requeridos, coordenadas válidas
- `radio`: Opcional, entre 10 y 10,000 metros

### Búsqueda por Área:
- `lat`, `lng` y `radius`: Requeridos
- Coordenadas válidas y radio dentro de límites

## Características Técnicas

### Cálculos de Distancia
- Utiliza la fórmula de Haversine para cálculos precisos
- Soporte para Google Maps API (configuración incluida)
- Validación de coordenadas geográficas

### Manejo de Errores
- Validaciones exhaustivas en el controlador
- Códigos de estado HTTP apropiados
- Mensajes de error descriptivos
- Try-catch blocks en todos los métodos

### Optimizaciones
- Consultas indexadas por estado activo
- Filtrado eficiente por tipo de ubicación
- Ordenamiento por distancia en búsquedas de área
- Configuración centralizada de límites y defaults

## Archivos Creados

1. **`src/types/location.types.ts`** - Interfaces y tipos TypeScript
2. **`src/config/googleMaps.config.ts`** - Configuración de Google Maps API
3. **`src/models/LocationService.ts`** - Servicio para operaciones de Firebase
4. **`src/controllers/location.controller.ts`** - Controlador con validaciones
5. **`src/routes/location.route.ts`** - Definición de rutas
6. **`src/index.ts`** - Integración en la aplicación principal (modificado)

## Ejemplos de Uso

### Validar si existe un punto cerca:
```bash
curl "http://localhost:3000/api/locations/validate?lat=4.6097&lng=-74.0817&radio=200"
```

### Crear un nuevo punto:
```bash
curl -X POST http://localhost:3000/api/locations \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Chatarrería Central",
    "lat": 4.6097,
    "lng": -74.0817,
    "tipo": "chatarreria"
  }'
```

### Listar puntos por tipo:
```bash
curl "http://localhost:3000/api/locations?tipo=basurero"
```

### Buscar en área específica:
```bash
curl "http://localhost:3000/api/locations/search/area?lat=4.6097&lng=-74.0817&radius=5000"
```

### Eliminar un punto:
```bash
curl -X DELETE http://localhost:3000/api/locations/location_id_123
```

## Configuración de Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# Google Maps API Key
GOOGLE_MAPS_API_KEY=tu_api_key_de_google_maps_aqui

# Firebase Configuration (si usas variables de entorno)
FIREBASE_API_KEY=tu_firebase_api_key
FIREBASE_PROJECT_ID=tu_project_id
```

## Consideraciones de Seguridad

- **API Key de Google Maps**: Nunca hardcodees la API key en el código
- **Restricciones de API**: Configura restricciones en Google Cloud Console
- **Validación de inputs**: Todas las coordenadas y parámetros son validados
- **Límites de radio**: Previene consultas excesivamente amplias
- **Sanitización**: Todos los strings son sanitizados antes de almacenar

## Próximas Mejoras Sugeridas

1. **Autenticación**: Sistema de permisos para crear/eliminar ubicaciones
2. **Geocodificación**: Convertir direcciones a coordenadas automáticamente
3. **Imágenes**: Soporte para fotos de los puntos de entrega
4. **Horarios**: Sistema de horarios de atención para cada punto
5. **Capacidad**: Información sobre capacidad y estado de llenado
6. **Notificaciones**: Alertas cuando se crean puntos cercanos
7. **Analytics**: Métricas de uso y cobertura geográfica
8. **Caché**: Implementar caché para consultas frecuentes
9. **Batch operations**: Operaciones en lote para múltiples ubicaciones
10. **Integration**: Integración con mapas en el frontend
