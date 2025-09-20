import { Timestamp } from 'firebase/firestore';

export interface Appointment {
    id?: string;
    clienteId: string;
    recicladorId: string;
    fecha: Timestamp;
    direccion: string;
    cantidadAproxMaterial: number;
    descripcion: string;
    materials: string[]; // Array de nombres de materiales
    estado: 'pendiente' | 'aprobada' | 'rechazada' | 'completada' | 'cancelada';
    fechaCreacion?: Timestamp;
    fechaActualizacion?: Timestamp;
    motivoRechazo?: string; // Solo se llena cuando el estado es 'rechazada'
}

export type EstadoAppointment = 'pendiente' | 'aprobada' | 'rechazada' | 'completada' | 'cancelada';

export interface ApproveRejectRequest {
    estado: 'aprobada' | 'rechazada';
    motivoRechazo?: string; // Requerido solo cuando estado es 'rechazada'
}
