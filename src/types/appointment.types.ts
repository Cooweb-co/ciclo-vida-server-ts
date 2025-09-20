import { Timestamp } from 'firebase/firestore';

export interface Appointment {
    id?: string;
    clienteId: string;
    recicladorId: string;
    fecha: Timestamp;
    direccion: string;
    cantidadAproxMaterial: number;
    descripcion: string;
    estado: 'pendiente' | 'completada';
}
