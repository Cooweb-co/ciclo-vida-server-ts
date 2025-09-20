// src/types/appointment.types.ts

export enum EstadoCita {
    PENDIENTE = 'pendiente',
    CONFIRMADA = 'confirmada',
    EN_PROGRESO = 'en_progreso',
    COMPLETADA = 'completada',
    CANCELADA = 'cancelada'
}

export enum TipoMaterial {
    PLASTICO = 'plastico',
    PAPEL = 'papel',
    CARTON = 'carton',
    VIDRIO = 'vidrio',
    METAL = 'metal',
    ELECTRONICO = 'electronico',
    ORGANICO = 'organico',
    TEXTIL = 'textil',
    OTRO = 'otro'
}

export interface IDetalleMaterial {
    tipo: TipoMaterial;
    cantidad: number; // en kg
}

export interface IAppointment {
    id: string;
    usuarioId: string;
    recicladorId: string;
    fechaCita: Date;
    direccion: string;
    lat: number;
    lng: number;
    estado: EstadoCita;
    descripcion?: string;
    fechaCreacion: Date;
    fechaActualizacion: Date;
}

export interface IAppointmentCompletion {
    id: string; // Igual al appointmentId
    fotos: string[]; // Array de URLs
    pesoTotal: number; // en kg
    detalleMaterial: IDetalleMaterial[];
    cantidadContenedores: number;
    observaciones: string;
    valorCalculado: number; // Valor monetario calculado
    creditosGenerados: number; // Créditos otorgados al usuario
    fechaCompletado: Date;
}

export interface ICompleteAppointmentRequest {
    fotos: string[];
    pesoTotal: number;
    detalleMaterial: IDetalleMaterial[];
    cantidadContenedores: number;
    observaciones: string;
}

export interface ICompleteAppointmentResponse {
    success: boolean;
    data?: {
        appointmentCompletion: IAppointmentCompletion;
        creditosGenerados: number;
        creditosTotal: number;
    };
    message?: string;
}

export interface ICreditCalculation {
    creditosPorKg: number;
    multiplicador: number;
    creditosBase: number;
    creditosBonus: number;
    creditosTotal: number;
}

// Configuración de créditos por tipo de material
export const CREDITOS_CONFIG = {
    [TipoMaterial.PLASTICO]: {
        creditosPorKg: 10,
        multiplicador: 1.0,
        descripcion: 'Plástico reciclable'
    },
    [TipoMaterial.PAPEL]: {
        creditosPorKg: 8,
        multiplicador: 1.0,
        descripcion: 'Papel y documentos'
    },
    [TipoMaterial.CARTON]: {
        creditosPorKg: 12,
        multiplicador: 1.0,
        descripcion: 'Cartón corrugado'
    },
    [TipoMaterial.VIDRIO]: {
        creditosPorKg: 15,
        multiplicador: 1.2,
        descripcion: 'Vidrio transparente y de color'
    },
    [TipoMaterial.METAL]: {
        creditosPorKg: 25,
        multiplicador: 1.5,
        descripcion: 'Metales ferrosos y no ferrosos'
    },
    [TipoMaterial.ELECTRONICO]: {
        creditosPorKg: 50,
        multiplicador: 2.0,
        descripcion: 'Dispositivos electrónicos'
    },
    [TipoMaterial.ORGANICO]: {
        creditosPorKg: 5,
        multiplicador: 0.8,
        descripcion: 'Residuos orgánicos compostables'
    },
    [TipoMaterial.TEXTIL]: {
        creditosPorKg: 18,
        multiplicador: 1.1,
        descripcion: 'Textiles y ropa'
    },
    [TipoMaterial.OTRO]: {
        creditosPorKg: 6,
        multiplicador: 0.9,
        descripcion: 'Otros materiales reciclables'
    }
};

// Bonificaciones adicionales
export const BONUS_CONFIG = {
    PESO_ALTO: {
        umbral: 50, // kg
        multiplicador: 1.2,
        descripcion: 'Bonificación por alto volumen'
    },
    VARIEDAD_MATERIALES: {
        umbral: 3, // tipos diferentes
        creditosBonus: 50,
        descripcion: 'Bonificación por variedad de materiales'
    },
    CONTENEDORES_MULTIPLES: {
        umbral: 5, // contenedores
        creditosBonus: 30,
        descripcion: 'Bonificación por múltiples contenedores'
    }
};
