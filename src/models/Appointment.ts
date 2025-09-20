import { collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, DocumentReference, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from './FirebaseService';
import { Appointment, EstadoAppointment, ApproveRejectRequest } from '../types/appointment.types';

const appointmentsCollection = collection(db, 'appointments');

const validateDocumentExists = async (collectionName: string, documentId: string): Promise<boolean> => {
    const docRef = doc(db, collectionName, documentId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
};

export const createAppointment = async (appointment: Omit<Appointment, 'id'>): Promise<DocumentReference> => {
    const clientExists = await validateDocumentExists('users', appointment.clienteId);
    if (!clientExists) {
        throw new Error(`Client with id ${appointment.clienteId} does not exist.`);
    }

    // Validar reciclador solo si se proporciona
    if (appointment.recicladorId) {
        const recyclerExists = await validateDocumentExists('recyclers', appointment.recicladorId);
        if (!recyclerExists) {
            throw new Error(`Recycler with id ${appointment.recicladorId} does not exist.`);
        }
    }

    // Asegurar que las citas nuevas siempre se crean con estado 'pendiente'
    const appointmentData = {
        ...appointment,
        estado: 'pendiente' as EstadoAppointment,
        fechaCreacion: serverTimestamp(),
        fechaActualizacion: serverTimestamp()
    };

    return await addDoc(appointmentsCollection, appointmentData);
};

export const getAppointments = async (): Promise<Appointment[]> => {
    const snapshot = await getDocs(appointmentsCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
};

export const getAppointmentById = async (id: string): Promise<Appointment | null> => {
    const docRef = doc(db, 'appointments', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Appointment;
    }
    return null;
};

export const updateAppointment = async (id: string, appointment: Partial<Appointment>): Promise<void> => {
    if (appointment.clienteId) {
        const clientExists = await validateDocumentExists('users', appointment.clienteId);
        if (!clientExists) {
            throw new Error(`Client with id ${appointment.clienteId} does not exist.`);
        }
    }

    if (appointment.recicladorId) {
        const recyclerExists = await validateDocumentExists('recyclers', appointment.recicladorId);
        if (!recyclerExists) {
            throw new Error(`Recycler with id ${appointment.recicladorId} does not exist.`);
        }
    }

    const docRef = doc(db, 'appointments', id);
    const updateData = {
        ...appointment,
        fechaActualizacion: serverTimestamp()
    };
    await updateDoc(docRef, updateData);
};

export const deleteAppointment = async (id: string): Promise<void> => {
    const docRef = doc(db, 'appointments', id);
    await deleteDoc(docRef);
};

/**
 * Obtener citas por estado
 */
export const getAppointmentsByStatus = async (estado: EstadoAppointment): Promise<Appointment[]> => {
    const q = query(appointmentsCollection, where('estado', '==', estado));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
};

/**
 * Aprobar o rechazar una cita
 */
export const approveOrRejectAppointment = async (id: string, approveRejectData: ApproveRejectRequest): Promise<Appointment> => {
    // Verificar que la cita existe
    const appointment = await getAppointmentById(id);
    if (!appointment) {
        throw new Error('Cita no encontrada');
    }

    // Verificar que la cita está en estado pendiente
    if (appointment.estado !== 'pendiente') {
        throw new Error(`No se puede cambiar el estado de una cita que está en estado '${appointment.estado}'. Solo se pueden aprobar/rechazar citas pendientes.`);
    }

    // Validar que si se rechaza, se proporcione un motivo
    if (approveRejectData.estado === 'rechazada' && (!approveRejectData.motivoRechazo || approveRejectData.motivoRechazo.trim() === '')) {
        throw new Error('El motivo de rechazo es requerido cuando se rechaza una cita');
    }

    // Preparar datos de actualización
    const updateData: any = {
        estado: approveRejectData.estado,
        fechaActualizacion: serverTimestamp()
    };

    // Solo agregar motivoRechazo si se está rechazando
    if (approveRejectData.estado === 'rechazada') {
        updateData.motivoRechazo = approveRejectData.motivoRechazo;
    }

    // Actualizar la cita
    const docRef = doc(db, 'appointments', id);
    await updateDoc(docRef, updateData);

    // Retornar la cita actualizada
    const updatedAppointment = await getAppointmentById(id);
    if (!updatedAppointment) {
        throw new Error('Error al obtener la cita actualizada');
    }

    return updatedAppointment;
};
