# Módulo de Créditos y Cupones - Ciclo Vida Server

## Descripción
Módulo completo para manejar créditos de usuarios y sistema de cupones usando Express + TypeScript con Firebase Firestore. Incluye validación de créditos, reclamación de cupones y historial de transacciones.

## Estructura de la Base de Datos

### Colección: `users`
```typescript
{
  id: string;
  creditos: number;              // Créditos acumulados del usuario
  fechaCreacion: Date;
  fechaActualizacion: Date;
  // ... otros campos del usuario
}
```

### Colección: `coupons`
```typescript
{
  id: string;
  titulo: string;                // Título del cupón
  descripcion: string;           // Descripción detallada
  costoCreditosRequeridos: number; // Créditos necesarios para reclamar
  categoria: string;             // Categoría del cupón (comida, transporte, etc.)
  empresa: string;               // Empresa que ofrece el cupón
  valorDescuento?: number;       // Valor del descuento en pesos
  porcentajeDescuento?: number;  // Porcentaje de descuento
  fechaVencimiento?: Date;       // Fecha de vencimiento del cupón
  imagenUrl?: string;            // URL de la imagen del cupón
  terminosCondiciones?: string;  // Términos y condiciones
  cantidadDisponible?: number;   // Cantidad disponible del cupón
  activo: boolean;               // Estado del cupón
  fechaCreacion: Date;
  fechaActualizacion: Date;
}
```

### Colección: `claimedCoupons`
```typescript
{
  id: string;                    // Autogenerado
  usuarioId: string;             // ID del usuario que reclamó
  couponId: string;              // ID del cupón reclamado
  fecha: Date;                   // Timestamp de reclamación
  estado: EstadoCuponReclamado;  // 'activo' | 'usado' | 'vencido' | 'cancelado'
  codigoCanjeado: string;        // Código único para canjear (formato: XXXX-XXXX-XXXX)
  fechaVencimiento?: Date;       // Fecha de vencimiento del cupón reclamado
  fechaUsado?: Date;             // Fecha cuando se usó el cupón
}
```

### Colección: `creditTransactions` (adicional)
```typescript
{
  id: string;
  usuarioId: string;
  tipo: TipoTransaccion;         // 'ganados' | 'gastados' | 'bonus' | 'ajuste'
  cantidad: number;              // Cantidad de créditos (positivo o negativo)
  descripcion: string;           // Descripción de la transacción
  referencia?: string;           // ID de referencia (cita, cupón, etc.)
  fecha: Date;
}
```

## Endpoints Principales Solicitados

### 1. Obtener Créditos de Usuario
**GET** `/api/users/:id/credits`

Retorna el campo 'creditos' del usuario en la colección 'users'.

**Parámetros:**
- `id` (path): ID del usuario

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "usuarioId": "user_123",
    "creditos": 1250,
    "fechaActualizacion": "2024-01-01T10:30:00.000Z"
  }
}
```

**Respuesta usuario no encontrado (404):**
```json
{
  "success": false,
  "error": "Usuario no encontrado"
}
```

### 2. Listar Todos los Cupones
**GET** `/api/coupons`

Lista todos los cupones activos de la colección 'coupons'.

**Parámetros de consulta (opcionales):**
- `categoria` (query): Filtrar por categoría
- `empresa` (query): Filtrar por empresa

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "coupon_123",
      "titulo": "20% descuento en McDonald's",
      "descripcion": "Obtén 20% de descuento en cualquier combo",
      "costoCreditosRequeridos": 500,
      "categoria": "comida",
      "empresa": "McDonald's",
      "porcentajeDescuento": 20,
      "fechaVencimiento": "2024-12-31T23:59:59.000Z",
      "imagenUrl": "https://ejemplo.com/mcdonalds.jpg",
      "cantidadDisponible": 100,
      "activo": true,
      "fechaCreacion": "2024-01-01T00:00:00.000Z",
      "fechaActualizacion": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

### 3. Reclamar Cupón
**POST** `/api/users/:id/claim-coupon`

Recibe couponId, valida créditos suficientes, resta créditos y crea registro en 'claimedCoupons'.

**Parámetros:**
- `id` (path): ID del usuario

**Body:**
```json
{
  "couponId": "coupon_123"
}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Cupón reclamado exitosamente",
  "data": {
    "claimedCoupon": {
      "id": "claimed_456",
      "usuarioId": "user_123",
      "couponId": "coupon_123",
      "fecha": "2024-01-01T10:30:00.000Z",
      "estado": "activo",
      "codigoCanjeado": "ABC1-DEF2-GHI3",
      "fechaVencimiento": "2024-12-31T23:59:59.000Z"
    },
    "creditosRestantes": 750,
    "codigoCanjeado": "ABC1-DEF2-GHI3"
  }
}
```

**Respuesta créditos insuficientes (400):**
```json
{
  "success": false,
  "error": "No se puede reclamar el cupón",
  "reason": "Créditos insuficientes. Necesitas 500 créditos, tienes 300",
  "creditosNecesarios": 500,
  "creditosActuales": 300
}
```

## Endpoints Adicionales Implementados

### 4. Obtener Cupones Reclamados por Usuario
**GET** `/api/users/:id/claimed-coupons`

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "claimed_456",
      "usuarioId": "user_123",
      "couponId": "coupon_123",
      "fecha": "2024-01-01T10:30:00.000Z",
      "estado": "activo",
      "codigoCanjeado": "ABC1-DEF2-GHI3",
      "fechaVencimiento": "2024-12-31T23:59:59.000Z"
    }
  ],
  "count": 1
}
```

### 5. Obtener Cupón por ID
**GET** `/api/coupons/:id`

### 6. Obtener Historial de Créditos
**GET** `/api/users/:id/credit-history`

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "transacciones": [
      {
        "id": "trans_789",
        "usuarioId": "user_123",
        "tipo": "gastados",
        "cantidad": -500,
        "descripcion": "Cupón reclamado: 20% descuento en McDonald's",
        "referencia": "claimed_456",
        "fecha": "2024-01-01T10:30:00.000Z"
      },
      {
        "id": "trans_788",
        "usuarioId": "user_123",
        "tipo": "ganados",
        "cantidad": 485,
        "descripcion": "Cita completada: appointment_123",
        "referencia": "appointment_123",
        "fecha": "2024-01-01T09:00:00.000Z"
      }
    ],
    "creditosActuales": 750,
    "totalGanados": 1250,
    "totalGastados": 500,
    "count": 2
  }
}
```

### 7. Verificar si se Puede Reclamar Cupón
**GET** `/api/users/:userId/can-claim/:couponId`

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "canClaim": true,
    "creditosNecesarios": 500,
    "creditosActuales": 750
  }
}
```

## Validaciones Implementadas

### Reclamar Cupón:
- **Usuario**: Debe existir en la base de datos
- **Cupón**: Debe existir y estar activo
- **Créditos**: Usuario debe tener créditos suficientes
- **Disponibilidad**: Cupón debe tener unidades disponibles
- **Vencimiento**: Cupón no debe estar vencido
- **Duplicados**: Usuario no puede reclamar el mismo cupón dos veces
- **Transaccional**: Operación atómica que garantiza consistencia

### Validación de Entrada:
- **IDs**: Strings no vacíos y válidos
- **couponId**: Requerido en el body para reclamar

## Características Técnicas

### Operaciones Transaccionales
El proceso de reclamación de cupones utiliza **transacciones de Firebase**:

1. **Verificar usuario** → Validar existencia y créditos
2. **Verificar cupón** → Validar disponibilidad y estado
3. **Validar elegibilidad** → Créditos suficientes, no duplicado
4. **Generar código** → Código único de canje (formato: XXXX-XXXX-XXXX)
5. **Crear reclamación** → Registro en `claimedCoupons`
6. **Restar créditos** → Actualizar `users.creditos`
7. **Actualizar disponibilidad** → Decrementar cantidad disponible
8. **Registrar transacción** → Historial en `creditTransactions`

Si cualquier paso falla, toda la operación se revierte automáticamente.

### Generación de Códigos de Canje
- **Formato**: XXXX-XXXX-XXXX (12 caracteres + 2 guiones)
- **Caracteres**: A-Z y 0-9 (36 posibilidades por posición)
- **Unicidad**: Probabilidad muy baja de colisión
- **Ejemplo**: `A1B2-C3D4-E5F6`

### Manejo de Estados
Los cupones reclamados tienen estados:
- **activo**: Recién reclamado, listo para usar
- **usado**: Ya fue canjeado/utilizado
- **vencido**: Expiró sin ser usado
- **cancelado**: Cancelado por alguna razón

## Archivos Creados

1. **`src/types/credits.types.ts`** - Interfaces y tipos TypeScript
2. **`src/models/CreditsCouponsService.ts`** - Servicio con lógica de negocio
3. **`src/controllers/credits.controller.ts`** - Controlador con validaciones
4. **`src/routes/credits.route.ts`** - Definición de endpoints
5. **`src/index.ts`** - Integración en la aplicación principal (modificado)

## Ejemplos de Uso

### Obtener créditos de un usuario:
```bash
curl "http://localhost:3000/api/users/user_123/credits"
```

### Listar cupones disponibles:
```bash
curl "http://localhost:3000/api/coupons"

# Con filtros
curl "http://localhost:3000/api/coupons?categoria=comida&empresa=McDonald's"
```

### Reclamar un cupón:
```bash
curl -X POST http://localhost:3000/api/users/user_123/claim-coupon \
  -H "Content-Type: application/json" \
  -d '{
    "couponId": "coupon_456"
  }'
```

### Verificar si se puede reclamar:
```bash
curl "http://localhost:3000/api/users/user_123/can-claim/coupon_456"
```

### Obtener cupones reclamados:
```bash
curl "http://localhost:3000/api/users/user_123/claimed-coupons"
```

### Obtener historial de créditos:
```bash
curl "http://localhost:3000/api/users/user_123/credit-history"
```

## Integración con Otros Módulos

### Con Módulo de Citas:
- Los créditos se generan automáticamente al completar citas
- Se registran transacciones en el historial
- Referencia cruzada entre citas y créditos ganados

### Con Módulo de Usuarios:
- Actualización automática del campo `creditos`
- Creación de usuario si no existe al otorgar créditos
- Historial completo de transacciones por usuario

### Flujo Completo de Créditos:
1. **Usuario completa cita** → Se generan créditos automáticamente
2. **Usuario ve cupones disponibles** → Lista cupones según sus créditos
3. **Usuario reclama cupón** → Se validan y restan créditos
4. **Usuario recibe código** → Puede canjear en establecimiento
5. **Historial completo** → Tracking de todas las transacciones

## Consideraciones de Seguridad

- **Validación exhaustiva**: Todos los inputs son validados
- **Transacciones atómicas**: Previenen inconsistencias de datos
- **Códigos únicos**: Generación segura de códigos de canje
- **Estados controlados**: Previenen uso múltiple de cupones
- **Límites de disponibilidad**: Control de inventario de cupones

## Próximas Mejoras Sugeridas

1. **Notificaciones**: Alertas cuando se reclaman cupones o se acumulan créditos
2. **Cupones personalizados**: Ofertas basadas en historial del usuario
3. **Fechas de vencimiento**: Gestión automática de cupones vencidos
4. **Categorías dinámicas**: Sistema de categorías configurable
5. **Descuentos escalonados**: Diferentes niveles según créditos acumulados
6. **Programa de referidos**: Créditos por invitar nuevos usuarios
7. **Analytics**: Métricas de uso de cupones y patrones de consumo
8. **API para empresas**: Endpoints para que empresas gestionen sus cupones
9. **Geolocalización**: Cupones basados en ubicación del usuario
10. **Gamificación**: Logros y bonificaciones especiales por actividad
