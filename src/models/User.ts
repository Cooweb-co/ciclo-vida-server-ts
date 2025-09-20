// src/models/User.ts
import { 
    collection, 
    addDoc, 
    getDocs, 
    getDoc, 
    doc, 
    updateDoc, 
    deleteDoc, 
    DocumentReference, 
    query, 
    where, 
    orderBy, 
    serverTimestamp,
    Timestamp 
} from 'firebase/firestore';
import { db } from './FirebaseService';
import { IUser, ICreateUserRequest, IUpdateUserRequest } from '../types/user.types';
import { Appointment } from '../types/appointment.types';
import { IReview } from '../types/review.types';

const usersCollection = collection(db, 'users');
const appointmentsCollection = collection(db, 'appointments');
const reviewsCollection = collection(db, 'reviews');

export const createUser = async (userData: ICreateUserRequest): Promise<DocumentReference> => {
    // Verificar que el email no exista
    const emailQuery = query(usersCollection, where('email', '==', userData.email));
    const emailSnapshot = await getDocs(emailQuery);
    
    if (!emailSnapshot.empty) {
        throw new Error('Ya existe un usuario con este email');
    }

    const userDoc = {
        ...userData,
        creditos: 0, // Créditos iniciales
        fechaCreacion: serverTimestamp(),
        fechaActualizacion: serverTimestamp(),
        activo: true
    };

    return await addDoc(usersCollection, userDoc);
};

export const getUsers = async (): Promise<IUser[]> => {
    const snapshot = await getDocs(usersCollection);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            name: data.name,
            email: data.email,
            phone: data.phone,
            address: data.address,
            coordinates: data.coordinates,
            avatar: data.avatar,
            creditos: data.creditos || 0,
            fechaCreacion: data.fechaCreacion?.toDate() || new Date(),
            fechaActualizacion: data.fechaActualizacion?.toDate() || new Date(),
            activo: data.activo !== false
        } as IUser;
    });
};

export const getUserById = async (id: string): Promise<IUser | null> => {
    const docRef = doc(db, 'users', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
        const data = docSnap.data();
        return {
            id: docSnap.id,
            name: data.name,
            email: data.email,
            phone: data.phone,
            address: data.address,
            coordinates: data.coordinates,
            avatar: data.avatar,
            creditos: data.creditos || 0,
            fechaCreacion: data.fechaCreacion?.toDate() || new Date(),
            fechaActualizacion: data.fechaActualizacion?.toDate() || new Date(),
            activo: data.activo !== false
        } as IUser;
    }
    return null;
};

export const updateUser = async (id: string, userData: IUpdateUserRequest): Promise<void> => {
    // Si se actualiza el email, verificar que no exista
    if (userData.email) {
        const emailQuery = query(usersCollection, where('email', '==', userData.email));
        const emailSnapshot = await getDocs(emailQuery);
        
        // Verificar que el email no pertenezca a otro usuario
        const existingUser = emailSnapshot.docs.find(doc => doc.id !== id);
        if (existingUser) {
            throw new Error('Ya existe otro usuario con este email');
        }
    }

    const docRef = doc(db, 'users', id);
    const updateData = {
        ...userData,
        fechaActualizacion: serverTimestamp()
    };
    await updateDoc(docRef, updateData);
};

export const deleteUser = async (id: string): Promise<void> => {
    const docRef = doc(db, 'users', id);
    await deleteDoc(docRef);
};

// Función para obtener citas de un usuario
export const getUserAppointments = async (userId: string): Promise<Appointment[]> => {
    const q = query(appointmentsCollection, where('clienteId', '==', userId), orderBy('fecha', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            clienteId: data.clienteId,
            recicladorId: data.recicladorId,
            fecha: data.fecha as Timestamp,
            direccion: data.direccion,
            cantidadAproxMaterial: data.cantidadAproxMaterial,
            descripcion: data.descripcion,
            materials: data.materials || [], // Incluir el nuevo campo materials
            estado: data.estado,
            fechaCreacion: data.fechaCreacion,
            fechaActualizacion: data.fechaActualizacion,
            motivoRechazo: data.motivoRechazo
        } as Appointment;
    });
};

// Función para obtener reseñas creadas por un usuario
export const getUserReviews = async (userId: string): Promise<IReview[]> => {
    const q = query(reviewsCollection, where('usuarioId', '==', userId), orderBy('fecha', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            recicladorId: data.recicladorId,
            usuarioId: data.usuarioId,
            rating: data.rating,
            comentario: data.comentario,
            fecha: data.fecha?.toDate() || new Date()
        } as IReview;
    });
};
