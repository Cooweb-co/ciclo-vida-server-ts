# Módulo de Citas y Finalización - Ciclo Vida Server

## Descripción
Módulo completo para manejar la finalización de citas de reciclaje con evidencias, cálculo automático de créditos y actualización de usuarios usando Express + TypeScript con Firebase Firestore.

## Estructura de la Base de Datos

### Colección: `appointments`
```typescript
{
  id: string;
  usuarioId: string;
  recicladorId: string;
  fechaCita: Date;
  direccion: string;
  lat: number;
  lng: number;
  estado: EstadoCita; // 'pendiente' | 'confirmada' | 'en_progreso' | 'completada' | 'cancelada'
  descripcion?: string;
  fechaCreacion: Date;
  fechaActualizacion: Date;
}
```

### Colección: `appointmentCompletions`
```typescript
{
  id: string;                    // Igual al appointmentId
  fotos: string[];               // Array de URLs de evidencias
  pesoTotal: number;             // Peso total en kg
  detalleMaterial: IDetalleMaterial[]; // Detalle por tipo de material
  cantidadContenedores: number;  // Número de contenedores utilizados
  observaciones: string;         // Observaciones del reciclador
  valorCalculado: number;        // Valor monetario estimado
  creditosGenerados: number;     // Créditos otorgados al usuario
  fechaCompletado: Date;         // Timestamp de finalización
}
```

### Estructura de Detalle de Material:
```typescript
{
  tipo: TipoMaterial;  // 'plastico' | 'papel' | 'carton' | 'vidrio' | 'metal' | 'electronico' | 'organico' | 'textil' | 'otro'
  cantidad: number;    // Cantidad en kg
}
```

### Colección: `users` (actualizada)
```typescript
{
  id: string;
  creditos: number;              // Créditos acumulados del usuario
  fechaCreacion: Date;
  fechaActualizacion: Date;
  // ... otros campos del usuario
}
```

## Endpoint Principal

### Completar Cita con Evidencias
**POST** `/api/appointments/:id/complete`

Completa una cita con evidencias fotográficas, calcula créditos automáticamente y actualiza el usuario.

**Parámetros:**
- `id` (path): ID de la cita a completar

**Body:**
```json
{
  "fotos": [
    "https://ejemplo.com/foto1.jpg",
    "https://ejemplo.com/foto2.jpg",
    "https://ejemplo.com/foto3.jpg"
  ],
  "pesoTotal": 25.5,
  "detalleMaterial": [
    {
      "tipo": "plastico",
      "cantidad": 10.2
    },
    {
      "tipo": "papel",
      "cantidad": 8.3
    },
    {
      "tipo": "metal",
      "cantidad": 7.0
    }
  ],
  "cantidadContenedores": 3,
  "observaciones": "Materiales en excelente estado para reciclaje. Usuario muy colaborativo en la separación."
}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Cita completada exitosamente",
  "data": {
    "appointmentCompletion": {
      "id": "appointment_123",
      "fotos": [
        "https://ejemplo.com/foto1.jpg",
        "https://ejemplo.com/foto2.jpg",
        "https://ejemplo.com/foto3.jpg"
      ],
      "pesoTotal": 25.5,
      "detalleMaterial": [
        {
          "tipo": "plastico",
          "cantidad": 10.2
        },
        {
          "tipo": "papel",
          "cantidad": 8.3
        },
        {
          "tipo": "metal",
          "cantidad": 7.0
        }
      ],
      "cantidadContenedores": 3,
      "observaciones": "Materiales en excelente estado para reciclaje. Usuario muy colaborativo en la separación.",
      "valorCalculado": 22400,
      "creditosGenerados": 485,
      "fechaCompletado": "2024-01-01T10:30:00.000Z"
    },
    "creditosGenerados": 485,
    "creditosTotal": 1250
  }
}
```

## Endpoints Adicionales

### 1. Obtener Finalización de Cita
**GET** `/api/appointments/:id/completion`

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "id": "appointment_123",
    "fotos": [...],
    "pesoTotal": 25.5,
    "detalleMaterial": [...],
    "cantidadContenedores": 3,
    "observaciones": "...",
    "valorCalculado": 22400,
    "creditosGenerados": 485,
    "fechaCompletado": "2024-01-01T10:30:00.000Z"
  }
}
```

### 2. Obtener Estadísticas de Finalización
**GET** `/api/appointments/:id/completion/stats`

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "creditosGenerados": 485,
    "valorCalculado": 22400,
    "pesoTotal": 25.5,
    "tiposMateriales": 3,
    "detalleCreditos": {
      "creditosPorKg": 19,
      "multiplicador": 1.2,
      "creditosBase": 405,
      "creditosBonus": 80,
      "creditosTotal": 485
    }
  }
}
```

### 3. Verificar si se Puede Completar
**GET** `/api/appointments/:id/can-complete`

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "canComplete": true,
    "appointment": {
      "id": "appointment_123",
      "usuarioId": "user_456",
      "recicladorId": "recycler_789",
      "estado": "confirmada",
      // ... otros campos
    }
  }
}
```

## Sistema de Cálculo de Créditos

### Créditos Base por Material
```typescript
const CREDITOS_CONFIG = {
  plastico: { creditosPorKg: 10, multiplicador: 1.0 },
  papel: { creditosPorKg: 8, multiplicador: 1.0 },
  carton: { creditosPorKg: 12, multiplicador: 1.0 },
  vidrio: { creditosPorKg: 15, multiplicador: 1.2 },
  metal: { creditosPorKg: 25, multiplicador: 1.5 },
  electronico: { creditosPorKg: 50, multiplicador: 2.0 },
  organico: { creditosPorKg: 5, multiplicador: 0.8 },
  textil: { creditosPorKg: 18, multiplicador: 1.1 },
  otro: { creditosPorKg: 6, multiplicador: 0.9 }
};
```

### Bonificaciones Adicionales

#### 1. Bonificación por Peso Alto
- **Umbral**: 50 kg o más
- **Bonificación**: 20% adicional sobre créditos base
- **Ejemplo**: 60 kg → +20% créditos

#### 2. Bonificación por Variedad de Materiales
- **Umbral**: 3 o más tipos diferentes
- **Bonificación**: +50 créditos fijos
- **Ejemplo**: Plástico + Papel + Metal → +50 créditos

#### 3. Bonificación por Múltiples Contenedores
- **Umbral**: 5 o más contenedores
- **Bonificación**: +30 créditos fijos
- **Ejemplo**: 6 contenedores → +30 créditos

### Ejemplo de Cálculo
```
Material: 10kg plástico + 5kg metal + 8kg papel
Créditos base: (10×10×1.0) + (5×25×1.5) + (8×8×1.0) = 100 + 187.5 + 64 = 351.5
Bonificación variedad: +50 (3 tipos diferentes)
Total: 401.5 ≈ 402 créditos
```

## Validaciones Implementadas

### Datos de Finalización:
- **fotos**: Array de 1-10 URLs válidas
- **pesoTotal**: Número positivo, máximo 1000 kg
- **detalleMaterial**: Array de 1-10 materiales, sin duplicados
- **cantidadContenedores**: Entero positivo, máximo 50
- **observaciones**: String de 10-1000 caracteres

### Validación de Materiales:
- **tipo**: Debe ser un TipoMaterial válido
- **cantidad**: Número positivo, máximo 500 kg, máximo 2 decimales
- **consistencia**: Suma de cantidades debe coincidir con pesoTotal (±5% tolerancia)

### Validación de Estado:
- La cita debe existir
- No debe estar ya completada
- No debe estar cancelada

## Operaciones Transaccionales

El proceso de finalización utiliza **transacciones de Firebase** para garantizar consistencia:

1. **Verificar cita**: Validar existencia y estado
2. **Calcular créditos**: Aplicar fórmulas y bonificaciones
3. **Guardar finalización**: Crear documento en `appointmentCompletions`
4. **Actualizar cita**: Cambiar estado a 'completada'
5. **Actualizar usuario**: Sumar créditos al total del usuario

Si cualquier paso falla, toda la operación se revierte automáticamente.

## Archivos Creados

1. **`src/types/appointment.types.ts`** - Interfaces, enums y configuración de créditos
2. **`src/models/AppointmentCompletionService.ts`** - Lógica de negocio y transacciones
3. **`src/controllers/appointment.controller.ts`** - Controlador con validaciones
4. **`src/routes/appointment.route.ts`** - Definición de endpoints
5. **`src/index.ts`** - Integración en la aplicación principal (modificado)

## Ejemplos de Uso

### Completar una cita:
```bash
curl -X POST http://localhost:3000/api/appointments/appointment_123/complete \
  -H "Content-Type: application/json" \
  -d '{
    "fotos": [
      "https://ejemplo.com/evidencia1.jpg",
      "https://ejemplo.com/evidencia2.jpg"
    ],
    "pesoTotal": 15.5,
    "detalleMaterial": [
      {
        "tipo": "plastico",
        "cantidad": 8.2
      },
      {
        "tipo": "papel",
        "cantidad": 7.3
      }
    ],
    "cantidadContenedores": 2,
    "observaciones": "Materiales bien separados y limpios"
  }'
```

### Verificar si se puede completar:
```bash
curl "http://localhost:3000/api/appointments/appointment_123/can-complete"
```

### Obtener estadísticas de finalización:
```bash
curl "http://localhost:3000/api/appointments/appointment_123/completion/stats"
```

## Valores de Referencia del Mercado

El sistema calcula valores monetarios estimados basados en precios de mercado colombiano:

```typescript
const VALORES_MERCADO = {
  plastico: 800,    // COP por kg
  papel: 600,       // COP por kg
  carton: 400,      // COP por kg
  vidrio: 200,      // COP por kg
  metal: 2000,      // COP por kg
  electronico: 5000, // COP por kg
  organico: 100,    // COP por kg
  textil: 1200,     // COP por kg
  otro: 300         // COP por kg
};
```

## Consideraciones de Seguridad

- **Validación exhaustiva**: Todos los inputs son validados antes del procesamiento
- **Transacciones atómicas**: Garantizan consistencia de datos
- **URLs de fotos**: Validación básica de formato URL
- **Límites de peso**: Previenen valores irreales
- **Tolerancia en pesos**: 5% de diferencia permitida entre total y suma de materiales

## Integración con Otros Módulos

### Con Módulo de Usuarios:
- Actualiza créditos automáticamente
- Crea registro de usuario si no existe

### Con Módulo de Recicladores:
- Referencia al reciclador que completó la cita
- Posible tracking de eficiencia por reciclador

### Con Módulo de Ubicaciones:
- Las citas pueden estar asociadas a ubicaciones registradas
- Posible análisis geográfico de completaciones

## Próximas Mejoras Sugeridas

1. **Subida de imágenes**: Integración con servicios de almacenamiento (AWS S3, Firebase Storage)
2. **Validación de imágenes**: Verificación automática de contenido usando IA
3. **Historial de créditos**: Tracking detallado de transacciones de créditos
4. **Notificaciones**: Alertas push cuando se completan citas
5. **Analytics**: Métricas de reciclaje por usuario, material, región
6. **Gamificación**: Logros y niveles basados en créditos acumulados
7. **Canje de créditos**: Sistema para intercambiar créditos por beneficios
8. **Auditoría**: Logs detallados de todas las operaciones
9. **Reportes**: Generación de reportes de impacto ambiental
10. **Machine Learning**: Predicción de créditos basada en patrones históricos
