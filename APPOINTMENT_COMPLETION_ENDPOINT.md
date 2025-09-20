# Endpoint de Finalización de Citas - POST /appointments/:id/complete

## Descripción
Endpoint específico para completar citas de reciclaje con evidencias fotográficas, cálculo automático de créditos y actualización de usuarios usando Express + TypeScript con Firebase Firestore.

## Endpoint

### Completar Cita con Evidencias
**POST** `/api/appointments/:id/complete`

Completa una cita con evidencias fotográficas, calcula créditos automáticamente y actualiza el usuario.

**Parámetros:**
- `id` (path): ID de la cita a completar

**Body:**
```json
{
  "fotos": [
    "https://ejemplo.com/evidencia1.jpg",
    "https://ejemplo.com/evidencia2.jpg",
    "https://ejemplo.com/evidencia3.jpg"
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
        "https://ejemplo.com/evidencia1.jpg",
        "https://ejemplo.com/evidencia2.jpg",
        "https://ejemplo.com/evidencia3.jpg"
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
      "valorCalculado": 18400
    },
    "creditosGenerados": 425,
    "creditosTotal": 1175
  }
}
```

## Estructura de la Base de Datos

### Colección: `appointmentCompletions`
```typescript
{
  id: string;                    // Igual al appointmentId
  fotos: string[];               // Array de URLs de evidencias
  pesoTotal: number;             // Peso total en kg
  detalleMaterial: IDetalleMaterial[]; // Detalle por tipo de material
  cantidadContenedores: number;  // Número de contenedores utilizados
  observaciones: string;         // Observaciones del reciclador
  valorCalculado: number;        // Valor monetario estimado en COP
}
```

### Estructura de Detalle de Material:
```typescript
{
  tipo: string;      // Tipo de material (plastico, papel, metal, etc.)
  cantidad: number;  // Cantidad en kg
}
```

### Colección: `appointments` (actualizada)
```typescript
{
  id: string;
  usuarioId: string;
  recicladorId: string;
  estado: string;                // Actualizado a 'completada'
  fechaActualizacion: Date;      // Timestamp actualizado
  // ... otros campos existentes
}
```

### Colección: `users` (actualizada)
```typescript
{
  id: string;
  creditos: number;              // Créditos actualizados automáticamente
  fechaActualizacion: Date;      // Timestamp actualizado
  // ... otros campos del usuario
}
```

## Sistema de Cálculo de Créditos

### Créditos Base por Material (por kg)
```typescript
const CREDITOS_POR_MATERIAL = {
  'plastico': 10,     // 10 créditos por kg
  'papel': 8,         // 8 créditos por kg
  'carton': 12,       // 12 créditos por kg
  'vidrio': 15,       // 15 créditos por kg
  'metal': 25,        // 25 créditos por kg
  'electronico': 50,  // 50 créditos por kg
  'organico': 5,      // 5 créditos por kg
  'textil': 18,       // 18 créditos por kg
  'otro': 6           // 6 créditos por kg (default)
};
```

### Bonificaciones Adicionales

#### 1. Bonificación por Peso Alto
- **Umbral**: Más de 20 kg
- **Bonificación**: +20% sobre créditos base
- **Ejemplo**: 25 kg → +20% créditos

#### 2. Bonificación por Variedad de Materiales
- **Umbral**: 3 o más tipos diferentes
- **Bonificación**: +50 créditos fijos
- **Ejemplo**: Plástico + Papel + Metal → +50 créditos

### Ejemplo de Cálculo
```
Materiales: 10.2kg plástico + 8.3kg papel + 7kg metal
Créditos base: (10.2×10) + (8.3×8) + (7×25) = 102 + 66.4 + 175 = 343.4
Bonificación peso (>20kg): 343.4 × 1.2 = 412.08
Bonificación variedad (3 tipos): +50
Total: 412.08 + 50 = 462.08 ≈ 462 créditos
```

## Cálculo de Valor Monetario

### Valores de Referencia del Mercado Colombiano (COP por kg)
```typescript
const VALORES_MERCADO = {
  'plastico': 800,    // $800 COP por kg
  'papel': 600,       // $600 COP por kg
  'carton': 400,      // $400 COP por kg
  'vidrio': 200,      // $200 COP por kg
  'metal': 2000,      // $2000 COP por kg
  'electronico': 5000, // $5000 COP por kg
  'organico': 100,    // $100 COP por kg
  'textil': 1200,     // $1200 COP por kg
  'otro': 300         // $300 COP por kg
};
```

### Ejemplo de Cálculo de Valor
```
Materiales: 10.2kg plástico + 8.3kg papel + 7kg metal
Valor: (10.2×800) + (8.3×600) + (7×2000) = 8160 + 4980 + 14000 = $27,140 COP
```

## Validaciones Implementadas

### Datos de Finalización:
- **fotos**: Array de 1-10 URLs válidas (obligatorio)
- **pesoTotal**: Número positivo, máximo 1000 kg
- **detalleMaterial**: Array de 1-10 materiales, sin duplicados
- **cantidadContenedores**: Entero positivo entre 1-50
- **observaciones**: String de 10-1000 caracteres

### Validación de Materiales:
- **tipo**: String no vacío (cualquier tipo permitido)
- **cantidad**: Número positivo, máximo 500 kg, máximo 2 decimales
- **consistencia**: Suma de cantidades debe coincidir con pesoTotal (±5% tolerancia)

### Validación de Estado:
- La cita debe existir en la colección `appointments`
- No debe estar ya completada
- No debe estar cancelada

### Validación de URLs:
- Formato de URL válido
- No pueden estar vacías
- Máximo 10 fotos por cita

## Operaciones Transaccionales

El proceso utiliza **transacciones de Firebase** para garantizar consistencia:

1. **Verificar cita**: Validar existencia y estado
2. **Calcular créditos**: Aplicar fórmulas y bonificaciones
3. **Calcular valor**: Estimar valor monetario
4. **Guardar finalización**: Crear documento en `appointmentCompletions`
5. **Actualizar cita**: Cambiar estado a 'completada'
6. **Actualizar usuario**: Sumar créditos al total del usuario

Si cualquier paso falla, toda la operación se revierte automáticamente.

## Respuestas de Error

### Cita no encontrada (404):
```json
{
  "success": false,
  "error": "Cita no encontrada",
  "message": "Cita no encontrada"
}
```

### Cita ya completada (409):
```json
{
  "success": false,
  "error": "Estado de cita inválido",
  "message": "La cita ya está completada"
}
```

### Datos inválidos (400):
```json
{
  "success": false,
  "error": "Datos de entrada inválidos",
  "details": "Las fotos son requeridas y deben ser un array"
}
```

### Error interno (500):
```json
{
  "success": false,
  "error": "Error interno del servidor",
  "message": "Error al completar la cita"
}
```

## Archivos del Proyecto

1. **`src/types/appointmentCompletion.types.ts`** - Interfaces y configuración
2. **`src/models/AppointmentCompletionService.ts`** - Lógica de negocio y transacciones
3. **`src/controllers/appointmentCompletion.controller.ts`** - Controlador con validaciones
4. **`src/routes/appointmentCompletion.route.ts`** - Definición del endpoint
5. **`src/index.ts`** - Integración en la aplicación principal (modificado)

## Ejemplo de Uso Completo

### Completar una cita:
```bash
curl -X POST http://localhost:3000/api/appointments/appointment_123/complete \
  -H "Content-Type: application/json" \
  -d '{
    "fotos": [
      "https://storage.googleapis.com/bucket/evidencia1.jpg",
      "https://storage.googleapis.com/bucket/evidencia2.jpg"
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
    "observaciones": "Materiales bien separados y limpios. Usuario siguió todas las instrucciones correctamente."
  }'
```

### Respuesta esperada:
```json
{
  "success": true,
  "message": "Cita completada exitosamente",
  "data": {
    "appointmentCompletion": {
      "id": "appointment_123",
      "fotos": ["https://storage.googleapis.com/bucket/evidencia1.jpg", "..."],
      "pesoTotal": 15.5,
      "detalleMaterial": [
        {"tipo": "plastico", "cantidad": 8.2},
        {"tipo": "papel", "cantidad": 7.3}
      ],
      "cantidadContenedores": 2,
      "observaciones": "Materiales bien separados y limpios...",
      "valorCalculado": 11000
    },
    "creditosGenerados": 140,
    "creditosTotal": 890
  }
}
```

## Integración con Otros Módulos

### Con Módulo de Créditos:
- Los créditos generados se suman automáticamente al usuario
- Se integra con el sistema de cupones existente
- Historial de transacciones se puede implementar fácilmente

### Con Módulo de Usuarios:
- Actualización automática del campo `creditos`
- Creación de usuario si no existe
- Timestamp de última actualización

### Flujo Completo:
1. **Usuario programa cita** → Estado 'pendiente'
2. **Reciclador completa servicio** → Usa este endpoint
3. **Sistema calcula créditos** → Basado en materiales y peso
4. **Usuario recibe créditos** → Puede canjear por cupones
5. **Cita queda completada** → Estado final 'completada'

## Consideraciones de Seguridad

- **Validación exhaustiva**: Todos los inputs son validados antes del procesamiento
- **Transacciones atómicas**: Garantizan consistencia de datos
- **URLs de fotos**: Validación básica de formato URL
- **Límites de peso**: Previenen valores irreales
- **Tolerancia en pesos**: 5% de diferencia permitida entre total y suma de materiales
- **Estado de citas**: Previene completar citas ya finalizadas

## Próximas Mejoras Sugeridas

1. **Subida de imágenes**: Integración directa con Firebase Storage o AWS S3
2. **Validación de imágenes**: Verificación automática de contenido usando IA
3. **Geolocalización**: Validar que las fotos se tomaron en la ubicación correcta
4. **Notificaciones**: Alertas push cuando se completan citas
5. **Analytics**: Métricas de reciclaje por usuario, material, región
6. **Auditoría**: Logs detallados de todas las operaciones de finalización
7. **Reportes**: Generación de reportes de impacto ambiental
8. **Machine Learning**: Predicción de créditos basada en patrones históricos
9. **Códigos QR**: Generación de códigos únicos para verificación
10. **Integración con balanzas**: Conexión directa con dispositivos IoT para pesaje automático
