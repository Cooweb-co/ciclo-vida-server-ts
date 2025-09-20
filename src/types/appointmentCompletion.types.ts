// src/types/appointmentCompletion.types.ts

export interface IDetalleMaterial {
    tipo: string;
    cantidad: number;
}

export interface IAppointmentCompletion {
    id: string; // Igual al appointmentId
    fotos: string[]; // Array de URLs
    pesoTotal: number;
    detalleMaterial: IDetalleMaterial[];
    cantidadContenedores: number;
    observaciones: string;
    valorCalculado: number;
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

// Configuración simple de créditos por tipo de material
export const CREDITOS_POR_MATERIAL: { [key: string]: number } = {
    'plastico': 10,
    'papel': 8,
    'carton': 12,
    'vidrio': 15,
    'metal': 25,
    'electronico': 50,
    'organico': 5,
    'textil': 18,
    'otro': 6
};

// Valores de mercado para cálculo monetario (COP por kg)
export const VALORES_MERCADO: { [key: string]: number } = {
    'plastico': 800,
    'papel': 600,
    'carton': 400,
    'vidrio': 200,
    'metal': 2000,
    'electronico': 5000,
    'organico': 100,
    'textil': 1200,
    'otro': 300
};
