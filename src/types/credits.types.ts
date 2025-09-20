// src/types/credits.types.ts

export interface IUser {
    id: string;
    creditos: number;
    fechaCreacion: Date;
    fechaActualizacion: Date;
    // Otros campos del usuario pueden ir aquí
}

export interface ICoupon {
    id: string;
    titulo: string;
    descripcion: string;
    costoCreditosRequeridos: number;
    categoria: string;
    empresa: string;
    valorDescuento?: number; // Valor del descuento en pesos
    porcentajeDescuento?: number; // Porcentaje de descuento
    fechaVencimiento?: Date;
    imagenUrl?: string;
    terminosCondiciones?: string;
    cantidadDisponible?: number; // Cantidad disponible del cupón
    activo: boolean;
    fechaCreacion: Date;
    fechaActualizacion: Date;
}

export interface IClaimedCoupon {
    id: string;
    usuarioId: string;
    couponId: string;
    fecha: Date;
    estado: EstadoCuponReclamado;
    codigoCanjeado?: string; // Código único para canjear el cupón
    fechaVencimiento?: Date;
    fechaUsado?: Date;
}

export enum EstadoCuponReclamado {
    ACTIVO = 'activo',
    USADO = 'usado',
    VENCIDO = 'vencido',
    CANCELADO = 'cancelado'
}

export interface IUserCreditsResponse {
    success: boolean;
    data?: {
        usuarioId: string;
        creditos: number;
        fechaActualizacion: Date;
    };
    message?: string;
}

export interface ICouponsListResponse {
    success: boolean;
    data?: ICoupon[];
    count?: number;
    message?: string;
}

export interface IClaimCouponRequest {
    couponId: string;
}

export interface IClaimCouponResponse {
    success: boolean;
    data?: {
        claimedCoupon: IClaimedCoupon;
        creditosRestantes: number;
        codigoCanjeado: string;
    };
    message?: string;
}

export interface ICreditTransaction {
    id: string;
    usuarioId: string;
    tipo: TipoTransaccion;
    cantidad: number;
    descripcion: string;
    referencia?: string; // ID de la cita, cupón, etc.
    fecha: Date;
}

export enum TipoTransaccion {
    GANADOS = 'ganados',
    GASTADOS = 'gastados',
    BONUS = 'bonus',
    AJUSTE = 'ajuste'
}

export interface ICreditHistory {
    transacciones: ICreditTransaction[];
    creditosActuales: number;
    totalGanados: number;
    totalGastados: number;
}
