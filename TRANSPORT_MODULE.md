# Módulo de Rutas de Transporte - Ciclo Vida Server

## Descripción
Módulo completo para manejar rutas de transporte de recicladores usando Express + TypeScript con Firebase Firestore. Incluye funcionalidades de optimización de rutas y cálculos de distancia.

## Estructura de la Base de Datos

### Colección: `transport`
```typescript
{
  id: string;                    // Autogenerado por Firebase
  recicladorId: string;          // ID del reciclador (referencia a recyclers)
  puntos: IPuntoRuta[];          // Array de puntos de la ruta
  fechaCreacion: Date;           // Timestamp de creación
  fechaActualizacion: Date;      // Timestamp de última actualización
  activo: boolean;               // Estado de la ruta
  distanciaTotal?: number;       // Distancia total en metros
  tiempoEstimado?: number;       // Tiempo estimado en minutos
}
```

### Estructura de Punto de Ruta:
```typescript
{
  lat: number;    // Latitud
  lng: number;    // Longitud  
  orden: number;  // Orden en la secuencia (1, 2, 3...)
}
```

## Endpoints Disponibles

### 1. Obtener Ruta de Reciclador
**GET** `/api/transport/recycler/:id`

Obtiene la ruta activa asignada a un reciclador específico.

**Parámetros:**
- `id` (path): ID del reciclador

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "id": "transport_123",
    "recicladorId": "recycler_456",
    "puntos": [
      {
        "lat": 4.6097,
        "lng": -74.0817,
        "orden": 1
      },
      {
        "lat": 4.6150,
        "lng": -74.0900,
        "orden": 2
      }
    ],
    "fechaCreacion": "2024-01-01T00:00:00.000Z",
    "fechaActualizacion": "2024-01-01T00:00:00.000Z",
    "activo": true,
    "distanciaTotal": 1250,
    "tiempoEstimado": 15,
    "stats": {
      "totalPuntos": 2,
      "distanciaTotal": 1250,
      "tiempoEstimado": 15
    }
  }
}
```

**Respuesta sin ruta (404):**
```json
{
  "success": false,
  "error": "No se encontró una ruta asignada para este reciclador",
  "message": "El reciclador no tiene una ruta activa asignada"
}
```

### 2. Asignar/Crear Ruta
**POST** `/api/transport/recycler/:id`

Asigna una nueva ruta a un reciclador o actualiza la existente.

**Parámetros:**
- `id` (path): ID del reciclador

**Body:**
```json
{
  "puntos": [
    {
      "lat": 4.6097,
      "lng": -74.0817,
      "orden": 1
    },
    {
      "lat": 4.6150,
      "lng": -74.0900,
      "orden": 2
    },
    {
      "lat": 4.6200,
      "lng": -74.0950,
      "orden": 3
    }
  ]
}
```

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "message": "Ruta asignada exitosamente",
  "data": {
    "id": "transport_123",
    "recicladorId": "recycler_456",
    "puntos": [
      // Puntos ordenados automáticamente
    ],
    "fechaCreacion": "2024-01-01T00:00:00.000Z",
    "fechaActualizacion": "2024-01-01T00:00:00.000Z",
    "activo": true,
    "distanciaTotal": 2500,
    "tiempoEstimado": 25
  }
}
```

### 3. Obtener Todas las Rutas Activas
**GET** `/api/transport/routes`

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "transport_123",
      "recicladorId": "recycler_456",
      "puntos": [...],
      "fechaCreacion": "2024-01-01T00:00:00.000Z",
      "fechaActualizacion": "2024-01-01T00:00:00.000Z",
      "activo": true,
      "distanciaTotal": 2500,
      "tiempoEstimado": 25
    }
  ],
  "count": 1
}
```

### 4. Obtener Estadísticas de Ruta
**GET** `/api/transport/routes/:id/stats`

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "totalPuntos": 5,
    "distanciaTotal": 3750,
    "tiempoEstimado": 35,
    "puntosOrdenados": [
      {
        "lat": 4.6097,
        "lng": -74.0817,
        "orden": 1
      }
      // ... más puntos ordenados
    ]
  }
}
```

### 5. Optimizar Ruta
**POST** `/api/transport/routes/:id/optimize`

Optimiza una ruta existente usando el algoritmo del vecino más cercano.

**Body (opcional):**
```json
{
  "puntoInicio": {
    "lat": 4.6097,
    "lng": -74.0817,
    "orden": 1
  }
}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Ruta optimizada exitosamente",
  "data": {
    // Ruta con puntos reordenados para minimizar distancia
  }
}
```

### 6. Actualizar Ruta
**PUT** `/api/transport/routes/:id`

**Body:**
```json
{
  "puntos": [
    // Nuevos puntos de la ruta
  ]
}
```

### 7. Desactivar Ruta
**DELETE** `/api/transport/routes/:id`

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Ruta desactivada exitosamente"
}
```

## Validaciones Implementadas

### Crear/Actualizar Ruta:
- `puntos`: Requerido, array con al menos 1 punto, máximo 50 puntos
- `lat`: Número entre -90 y 90
- `lng`: Número entre -180 y 180
- `orden`: Número entero positivo, sin duplicados
- `recicladorId`: String no vacío

### Optimizar Ruta:
- `puntoInicio`: Opcional, debe tener coordenadas válidas si se proporciona
- Validación de existencia de la ruta

## Características Técnicas

### Cálculos de Distancia y Tiempo
- Utiliza la fórmula de Haversine para cálculos precisos
- Distancia total calculada automáticamente
- Tiempo estimado basado en velocidad promedio de 30 km/h
- Actualización automática de estadísticas

### Optimización de Rutas
- Algoritmo del vecino más cercano (Nearest Neighbor)
- Minimiza la distancia total de la ruta
- Preserva punto de inicio si se especifica
- Reasignación automática de órdenes

### Gestión de Rutas
- Una ruta activa por reciclador
- Actualización automática si ya existe ruta
- Validación de orden secuencial
- Cálculo automático de estadísticas

### Manejo de Errores
- Validaciones exhaustivas en el controlador
- Códigos de estado HTTP apropiados
- Mensajes de error descriptivos
- Try-catch blocks en todos los métodos

## Archivos Creados

1. **`src/types/transport.types.ts`** - Interfaces y tipos TypeScript
2. **`src/models/TransportService.ts`** - Servicio para operaciones de Firebase
3. **`src/controllers/transport.controller.ts`** - Controlador con validaciones
4. **`src/routes/transport.route.ts`** - Definición de rutas
5. **`src/index.ts`** - Integración en la aplicación principal (modificado)

## Ejemplos de Uso

### Asignar ruta a un reciclador:
```bash
curl -X POST http://localhost:3000/api/transport/recycler/recycler_123 \
  -H "Content-Type: application/json" \
  -d '{
    "puntos": [
      {
        "lat": 4.6097,
        "lng": -74.0817,
        "orden": 1
      },
      {
        "lat": 4.6150,
        "lng": -74.0900,
        "orden": 2
      },
      {
        "lat": 4.6200,
        "lng": -74.0950,
        "orden": 3
      }
    ]
  }'
```

### Obtener ruta de un reciclador:
```bash
curl "http://localhost:3000/api/transport/recycler/recycler_123"
```

### Optimizar una ruta:
```bash
curl -X POST http://localhost:3000/api/transport/routes/transport_123/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "puntoInicio": {
      "lat": 4.6097,
      "lng": -74.0817,
      "orden": 1
    }
  }'
```

### Obtener estadísticas de ruta:
```bash
curl "http://localhost:3000/api/transport/routes/transport_123/stats"
```

### Listar todas las rutas activas:
```bash
curl "http://localhost:3000/api/transport/routes"
```

## Integración con Otros Módulos

### Con Módulo de Recicladores:
- Referencia `recicladorId` a la colección `recyclers`
- Validación de existencia de reciclador (recomendado implementar)

### Con Módulo de Ubicaciones:
- Los puntos de ruta pueden corresponder a ubicaciones registradas
- Posible validación cruzada de puntos con ubicaciones existentes

### Con Módulo de Reseñas:
- Las rutas completadas pueden generar oportunidades de reseñas
- Tracking de eficiencia de rutas optimizadas

## Algoritmo de Optimización

### Vecino Más Cercano (Nearest Neighbor):
1. Comienza en el punto de inicio especificado (o el primero)
2. Encuentra el punto más cercano no visitado
3. Se mueve a ese punto y lo marca como visitado
4. Repite hasta visitar todos los puntos
5. Reasigna órdenes secuenciales

**Ventajas:**
- Rápido y eficiente para rutas pequeñas-medianas
- Reduce significativamente la distancia total
- Fácil de entender e implementar

**Limitaciones:**
- No garantiza la solución óptima global
- Para rutas muy grandes, considerar algoritmos más avanzados

## Consideraciones de Rendimiento

- **Límite de puntos**: Máximo 50 puntos por ruta
- **Caché de cálculos**: Distancias calculadas una vez y almacenadas
- **Consultas optimizadas**: Índices en `recicladorId` y `activo`
- **Validación temprana**: Errores detectados antes de operaciones costosas

## Próximas Mejoras Sugeridas

1. **Algoritmos avanzados**: Implementar algoritmo genético o simulated annealing
2. **Tiempo real**: Integración con APIs de tráfico para tiempos reales
3. **Restricciones**: Horarios, capacidad de vehículo, tipos de residuos
4. **Tracking**: Seguimiento en tiempo real del progreso de la ruta
5. **Notificaciones**: Alertas cuando se completan puntos de la ruta
6. **Analytics**: Métricas de eficiencia y optimización
7. **Mapas visuales**: Integración con mapas interactivos
8. **Rutas múltiples**: Soporte para múltiples rutas por reciclador
9. **Backup routes**: Rutas alternativas en caso de bloqueos
10. **Machine Learning**: Aprendizaje de patrones para mejores optimizaciones
