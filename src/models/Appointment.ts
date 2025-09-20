import { collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, DocumentReference } from 'firebase/firestore';
import { db } from './FirebaseService';
import { Appointment } from '../types/appointment.types';

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

    const recyclerExists = await validateDocumentExists('recyclers', appointment.recicladorId);
    if (!recyclerExists) {
        throw new Error(`Recycler with id ${appointment.recicladorId} does not exist.`);
    }

    return await addDoc(appointmentsCollection, appointment);
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
    await updateDoc(docRef, appointment);
};

export const deleteAppointment = async (id: string): Promise<void> => {
    const docRef = doc(db, 'appointments', id);
    await deleteDoc(docRef);
};
