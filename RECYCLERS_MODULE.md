# Módulo de Recicladores - Ciclo Vida Server

## Descripción
Módulo completo para gestionar perfiles de recicladores usando Express + TypeScript con Firebase Firestore.

## Estructura de la Base de Datos

### Colección: `recyclers`
```typescript
{
  id: string;                    // UID del reciclador
  zonasCobertura: IZonaCobertura[]; // Array de zonas de cobertura
  infoBase: IInfoBase;           // Información básica del reciclador
  fechaCreacion: Date;           // Timestamp de creación
  fechaActualizacion: Date;      // Timestamp de última actualización
  activo: boolean;               // Estado del reciclador
}
```

### Estructura de Zona de Cobertura:
```typescript
{
  lat: number;    // Latitud
  lng: number;    // Longitud
  radio: number;  // Radio en metros (100-50000)
}
```

### Estructura de Información Base:
```typescript
{
  nombre: string;              // Nombre del reciclador (requerido)
  telefono: string;            // Teléfono de contacto (requerido)
  email?: string;              // Email (opcional)
  descripcion?: string;        // Descripción del servicio (opcional)
  tiposResiduos?: string[];    // Tipos de residuos que maneja (opcional)
  horarioAtencion?: string;    // Horario de atención (opcional)
  sitioWeb?: string;           // Sitio web (opcional)
}
```

## Endpoints Disponibles

### 1. Crear Reciclador
**POST** `/api/recyclers`

**Body:**
```json
{
  "id": "recycler_uid_123",
  "zonasCobertura": [
    {
      "lat": 4.6097,
      "lng": -74.0817,
      "radio": 5000
    }
  ],
  "infoBase": {
    "nombre": "EcoRecicla Bogotá",
    "telefono": "+57 300 123 4567",
    "email": "contacto@ecorecicla.com",
    "descripcion": "Servicio de reciclaje especializado en residuos electrónicos",
    "tiposResiduos": ["electrónicos", "plásticos", "metales"],
    "horarioAtencion": "Lunes a Viernes 8:00 AM - 6:00 PM"
  }
}
```

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "message": "Reciclador creado exitosamente",
  "data": {
    "id": "recycler_uid_123",
    "zonasCobertura": [...],
    "infoBase": {...},
    "fechaCreacion": "2024-01-01T00:00:00.000Z",
    "fechaActualizacion": "2024-01-01T00:00:00.000Z",
    "activo": true
  }
}
```

### 2. Obtener Reciclador por ID
**GET** `/api/recyclers/:id`

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "id": "recycler_uid_123",
    "zonasCobertura": [...],
    "infoBase": {...},
    "fechaCreacion": "2024-01-01T00:00:00.000Z",
    "fechaActualizacion": "2024-01-01T00:00:00.000Z",
    "activo": true
  }
}
```

### 3. Actualizar Reciclador
**PUT** `/api/recyclers/:id`

**Body (todos los campos son opcionales):**
```json
{
  "zonasCobertura": [
    {
      "lat": 4.6097,
      "lng": -74.0817,
      "radio": 7000
    }
  ],
  "infoBase": {
    "telefono": "+57 300 999 8888",
    "descripcion": "Descripción actualizada"
  },
  "activo": true
}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Reciclador actualizado exitosamente",
  "data": {
    // Datos actualizados del reciclador
  }
}
```

### 4. Eliminar Reciclador
**DELETE** `/api/recyclers/:id`

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Reciclador eliminado exitosamente"
}
```

### 5. Obtener Todos los Recicladores Activos
**GET** `/api/recyclers`

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "recycler_uid_123",
      "zonasCobertura": [...],
      "infoBase": {...},
      "fechaCreacion": "2024-01-01T00:00:00.000Z",
      "fechaActualizacion": "2024-01-01T00:00:00.000Z",
      "activo": true
    }
  ],
  "count": 1
}
```

### 6. Buscar Recicladores por Ubicación
**GET** `/api/recyclers/search/location?lat=4.6097&lng=-74.0817&maxDistance=10000`

**Parámetros de consulta:**
- `lat` (requerido): Latitud
- `lng` (requerido): Longitud
- `maxDistance` (opcional): Distancia máxima en metros (default: 5000, max: 50000)

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      // Recicladores dentro del radio especificado
    }
  ],
  "count": 2,
  "searchParams": {
    "lat": 4.6097,
    "lng": -74.0817,
    "maxDistance": 10000
  }
}
```

## Validaciones Implementadas

### Crear Reciclador:
- `id`: Requerido, string no vacío
- `zonasCobertura`: Requerido, array con al menos una zona
- `infoBase.nombre`: Requerido, 2-100 caracteres
- `infoBase.telefono`: Requerido, formato válido
- `infoBase.email`: Opcional, formato de email válido
- Coordenadas: Latitud (-90 a 90), Longitud (-180 a 180)
- Radio: Entre 100 y 50,000 metros

### Actualizar Reciclador:
- Al menos un campo debe ser proporcionado
- Validaciones similares a crear, pero todos los campos son opcionales
- Merge inteligente de `infoBase` (preserva campos no actualizados)

### Búsqueda por Ubicación:
- `lat` y `lng`: Requeridos, números válidos
- `maxDistance`: Entre 100 y 50,000 metros
- Validación de coordenadas válidas

## Características Técnicas

### Gestión de Ubicaciones
- Cálculo de distancias usando la fórmula de Haversine
- Búsqueda eficiente por proximidad geográfica
- Soporte para múltiples zonas de cobertura por reciclador

### Manejo de Errores
- Validaciones exhaustivas en el controlador
- Códigos de estado HTTP apropiados (400, 404, 409, 500)
- Mensajes de error descriptivos
- Try-catch blocks en todos los métodos

### Optimizaciones
- Uso de `serverTimestamp()` para timestamps consistentes
- Consultas indexadas por estado activo
- Merge inteligente en actualizaciones
- Validación de existencia antes de operaciones

## Archivos Creados

1. **`src/types/recycler.types.ts`** - Interfaces y tipos TypeScript
2. **`src/models/RecyclerService.ts`** - Servicio para operaciones de Firebase
3. **`src/controllers/recycler.controller.ts`** - Controlador con validaciones
4. **`src/routes/recycler.route.ts`** - Definición de rutas
5. **`src/index.ts`** - Integración en la aplicación principal (modificado)

## Ejemplos de Uso

### Crear un reciclador:
```bash
curl -X POST http://localhost:3000/api/recyclers \
  -H "Content-Type: application/json" \
  -d '{
    "id": "recycler_123",
    "zonasCobertura": [
      {
        "lat": 4.6097,
        "lng": -74.0817,
        "radio": 5000
      }
    ],
    "infoBase": {
      "nombre": "EcoRecicla Bogotá",
      "telefono": "+57 300 123 4567",
      "email": "contacto@ecorecicla.com"
    }
  }'
```

### Actualizar zonas de cobertura:
```bash
curl -X PUT http://localhost:3000/api/recyclers/recycler_123 \
  -H "Content-Type: application/json" \
  -d '{
    "zonasCobertura": [
      {
        "lat": 4.6097,
        "lng": -74.0817,
        "radio": 7000
      },
      {
        "lat": 4.6500,
        "lng": -74.1000,
        "radio": 3000
      }
    ]
  }'
```

### Buscar recicladores cercanos:
```bash
curl "http://localhost:3000/api/recyclers/search/location?lat=4.6097&lng=-74.0817&maxDistance=10000"
```

## Consideraciones de Seguridad

- Validación exhaustiva de todos los inputs
- Sanitización de coordenadas geográficas
- Límites en tamaños de arrays y strings
- Manejo seguro de errores sin exposición de información sensible
- Validación de formatos de email y teléfono

## Próximas Mejoras Sugeridas

1. **Autenticación y autorización**: Solo el reciclador propietario puede actualizar su perfil
2. **Índices geoespaciales**: Implementar GeoFirestore para búsquedas más eficientes
3. **Caché**: Implementar caché para búsquedas frecuentes por ubicación
4. **Imágenes**: Soporte para fotos de perfil y galería de servicios
5. **Horarios**: Sistema más robusto para horarios de atención
6. **Calificaciones**: Integración con el módulo de reseñas
7. **Notificaciones**: Sistema de notificaciones para nuevos servicios en zona
8. **Analytics**: Métricas de cobertura y demanda por zonas
