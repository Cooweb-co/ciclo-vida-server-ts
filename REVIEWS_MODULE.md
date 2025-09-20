# Módulo de Reseñas - Ciclo Vida Server

## Descripción
Módulo completo para manejar reseñas de recicladores usando Express + TypeScript con Firebase Firestore.

## Estructura de la Base de Datos

### Colección: `reviews`
```typescript
{
  id: string;           // Autogenerado por Firebase
  recicladorId: string; // ID del reciclador
  usuarioId: string;    // ID del usuario que hace la reseña
  rating: number;       // Calificación de 1-5
  comentario: string;   // Comentario de la reseña
  fecha: Date;          // Timestamp de creación
}
```

## Endpoints Disponibles

### 1. Crear Reseña
**POST** `/api/recyclers/:id/reviews`

**Parámetros:**
- `id` (path): ID del reciclador

**Body:**
```json
{
  "usuarioId": "string",
  "rating": 1-5,
  "comentario": "string (5-500 caracteres)"
}
```

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "message": "Reseña creada exitosamente",
  "data": {
    "id": "doc_id",
    "recicladorId": "recycler_id",
    "usuarioId": "user_id",
    "rating": 5,
    "comentario": "Excelente servicio",
    "fecha": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2. Obtener Reseñas con Paginación
**GET** `/api/recyclers/:id/reviews`

**Parámetros:**
- `id` (path): ID del reciclador
- `limit` (query, opcional): Número de reseñas (1-50, default: 10)
- `startAfter` (query, opcional): ID del documento para paginación

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": "doc_id",
        "recicladorId": "recycler_id",
        "usuarioId": "user_id",
        "rating": 5,
        "comentario": "Excelente servicio",
        "fecha": "2024-01-01T00:00:00.000Z"
      }
    ],
    "hasMore": true,
    "lastDoc": "last_doc_id",
    "stats": {
      "averageRating": 4.5,
      "totalReviews": 25
    }
  }
}
```

### 3. Obtener Estadísticas de Reciclador
**GET** `/api/recyclers/:id/reviews/stats`

**Parámetros:**
- `id` (path): ID del reciclador

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "recicladorId": "recycler_id",
    "averageRating": 4.5,
    "totalReviews": 25
  }
}
```

## Validaciones Implementadas

### Crear Reseña:
- `usuarioId`: Requerido, string no vacío
- `rating`: Requerido, número entero entre 1-5
- `comentario`: Requerido, string entre 5-500 caracteres
- `recicladorId`: Validado desde parámetros de URL

### Obtener Reseñas:
- `limit`: Opcional, número entre 1-50
- `startAfter`: Opcional, string válido
- `recicladorId`: Validado desde parámetros de URL

## Características Técnicas

### Paginación
- Utiliza `limit` y `startAfter` de Firebase Firestore
- Retorna `hasMore` para indicar si hay más documentos
- Incluye `lastDoc` para la siguiente página

### Manejo de Errores
- Validaciones completas en el controlador
- Manejo de errores de Firebase
- Respuestas consistentes con códigos HTTP apropiados
- Try-catch blocks en todos los métodos

### Optimizaciones
- Consultas indexadas por `recicladorId` y `fecha`
- Límite máximo de 50 documentos por consulta
- Cálculo eficiente de promedios

## Archivos Creados

1. **`src/types/review.types.ts`** - Interfaces y tipos TypeScript
2. **`src/models/ReviewService.ts`** - Servicio para operaciones de Firebase
3. **`src/controllers/review.controller.ts`** - Controlador con validaciones
4. **`src/routes/review.route.ts`** - Definición de rutas
5. **`src/index.ts`** - Integración en la aplicación principal (modificado)

## Ejemplos de Uso

### Crear una reseña:
```bash
curl -X POST http://localhost:3000/api/recyclers/recycler123/reviews \
  -H "Content-Type: application/json" \
  -d '{
    "usuarioId": "user456",
    "rating": 5,
    "comentario": "Excelente servicio de reciclaje, muy profesional"
  }'
```

### Obtener reseñas con paginación:
```bash
# Primera página
curl "http://localhost:3000/api/recyclers/recycler123/reviews?limit=5"

# Página siguiente
curl "http://localhost:3000/api/recyclers/recycler123/reviews?limit=5&startAfter=doc_id_123"
```

### Obtener estadísticas:
```bash
curl "http://localhost:3000/api/recyclers/recycler123/reviews/stats"
```

## Consideraciones de Seguridad

- Validación exhaustiva de todos los inputs
- Sanitización de parámetros de consulta
- Límites en el tamaño de comentarios
- Manejo seguro de errores sin exposición de información sensible

## Próximas Mejoras Sugeridas

1. Autenticación y autorización de usuarios
2. Validación de existencia de recicladores y usuarios
3. Sistema de moderación de comentarios
4. Índices compuestos en Firebase para mejor rendimiento
5. Rate limiting para prevenir spam
6. Sistema de reportes de reseñas inapropiadas
