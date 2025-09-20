// src/types/transport.types.ts

export interface IPuntoRuta {
    lat: number;
    lng: number;
    orden: number;
}

export interface ITransport {
    id: string;
    recicladorId: string;
    puntos: IPuntoRuta[];
    fechaCreacion: Date;
    fechaActualizacion: Date;
    activo: boolean;
    distanciaTotal?: number; // Distancia total de la ruta en metros
    tiempoEstimado?: number; // Tiempo estimado en minutos
}

export interface ICreateTransportRequest {
    recicladorId: string;
    puntos: IPuntoRuta[];
}

export interface IUpdateTransportRequest {
    puntos: IPuntoRuta[];
}

export interface ITransportResponse {
    success: boolean;
    data?: ITransport;
    message?: string;
}

export interface ITransportStatsResponse {
    success: boolean;
    data?: {
        totalPuntos: number;
        distanciaTotal: number;
        tiempoEstimado: number;
        puntosOrdenados: IPuntoRuta[];
    };
    message?: string;
}

export enum EstadoRuta {
    PENDIENTE = 'pendiente',
    EN_PROGRESO = 'en_progreso',
    COMPLETADA = 'completada',
    CANCELADA = 'cancelada'
}

export interface ITransportConEstado extends ITransport {
    estado: EstadoRuta;
    fechaInicio?: Date;
    fechaFinalizacion?: Date;
    progreso?: number; // Porcentaje de progreso (0-100)
}
