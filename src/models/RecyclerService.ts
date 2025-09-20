// src/models/RecyclerService.ts
import { 
    collection, 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc, 
    deleteDoc, 
    getDocs,
    query,
    where,
    Timestamp,
    serverTimestamp
} from 'firebase/firestore';
import { db } from './FirebaseService';
import { 
    IRecycler, 
    ICreateRecyclerRequest, 
    IUpdateRecyclerRequest,
    IZonaCobertura,
    IInfoBase
} from '../types/recycler.types';

export class RecyclerService {
    private static readonly COLLECTION_NAME = 'recyclers';

    /**
     * Crear un nuevo reciclador
     */
    static async createRecycler(recyclerData: ICreateRecyclerRequest): Promise<IRecycler> {
        try {
            const recyclerRef = doc(db, this.COLLECTION_NAME, recyclerData.id);
            
            // Verificar si el reciclador ya existe
            const existingRecycler = await getDoc(recyclerRef);
            if (existingRecycler.exists()) {
                throw new Error('El reciclador ya existe');
            }

            const now = new Date();
            const newRecycler = {
                id: recyclerData.id,
                zonasCobertura: recyclerData.zonasCobertura,
                infoBase: recyclerData.infoBase,
                fechaCreacion: Timestamp.fromDate(now),
                fechaActualizacion: Timestamp.fromDate(now),
                activo: true
            };

            await setDoc(recyclerRef, newRecycler);

            return {
                id: recyclerData.id,
                zonasCobertura: recyclerData.zonasCobertura,
                infoBase: recyclerData.infoBase,
                fechaCreacion: now,
                fechaActualizacion: now,
                activo: true
            };
        } catch (error) {
            console.error('Error creating recycler:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Error al crear el reciclador');
        }
    }

    /**
     * Obtener un reciclador por ID
     */
    static async getRecyclerById(id: string): Promise<IRecycler | null> {
        try {
            const recyclerRef = doc(db, this.COLLECTION_NAME, id);
            const recyclerSnap = await getDoc(recyclerRef);

            if (!recyclerSnap.exists()) {
                return null;
            }

            const data = recyclerSnap.data();
            return {
                id: recyclerSnap.id,
                zonasCobertura: data.zonasCobertura,
                infoBase: data.infoBase,
                fechaCreacion: data.fechaCreacion.toDate(),
                fechaActualizacion: data.fechaActualizacion.toDate(),
                activo: data.activo
            };
        } catch (error) {
            console.error('Error getting recycler:', error);
            throw new Error('Error al obtener el reciclador');
        }
    }

    /**
     * Actualizar un reciclador
     */
    static async updateRecycler(id: string, updateData: IUpdateRecyclerRequest): Promise<IRecycler | null> {
        try {
            const recyclerRef = doc(db, this.COLLECTION_NAME, id);
            
            // Verificar si el reciclador existe
            const existingRecycler = await getDoc(recyclerRef);
            if (!existingRecycler.exists()) {
                return null;
            }

            const updatePayload: any = {
                fechaActualizacion: serverTimestamp()
            };

            if (updateData.zonasCobertura !== undefined) {
                updatePayload.zonasCobertura = updateData.zonasCobertura;
            }

            if (updateData.infoBase !== undefined) {
                // Merge con la información base existente
                const currentData = existingRecycler.data();
                updatePayload.infoBase = {
                    ...currentData.infoBase,
                    ...updateData.infoBase
                };
            }

            if (updateData.activo !== undefined) {
                updatePayload.activo = updateData.activo;
            }

            await updateDoc(recyclerRef, updatePayload);

            // Obtener el documento actualizado
            const updatedRecycler = await getDoc(recyclerRef);
            const data = updatedRecycler.data()!;

            return {
                id: updatedRecycler.id,
                zonasCobertura: data.zonasCobertura,
                infoBase: data.infoBase,
                fechaCreacion: data.fechaCreacion.toDate(),
                fechaActualizacion: data.fechaActualizacion.toDate(),
                activo: data.activo
            };
        } catch (error) {
            console.error('Error updating recycler:', error);
            throw new Error('Error al actualizar el reciclador');
        }
    }

    /**
     * Eliminar un reciclador
     */
    static async deleteRecycler(id: string): Promise<boolean> {
        try {
            const recyclerRef = doc(db, this.COLLECTION_NAME, id);
            
            // Verificar si el reciclador existe
            const existingRecycler = await getDoc(recyclerRef);
            if (!existingRecycler.exists()) {
                return false;
            }

            await deleteDoc(recyclerRef);
            return true;
        } catch (error) {
            console.error('Error deleting recycler:', error);
            throw new Error('Error al eliminar el reciclador');
        }
    }

    /**
     * Obtener todos los recicladores activos
     */
    static async getAllActiveRecyclers(): Promise<IRecycler[]> {
        try {
            const recyclersCollection = collection(db, this.COLLECTION_NAME);
            const activeRecyclersQuery = query(
                recyclersCollection,
                where('activo', '==', true)
            );

            const querySnapshot = await getDocs(activeRecyclersQuery);
            const recyclers: IRecycler[] = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                recyclers.push({
                    id: doc.id,
                    zonasCobertura: data.zonasCobertura,
                    infoBase: data.infoBase,
                    fechaCreacion: data.fechaCreacion.toDate(),
                    fechaActualizacion: data.fechaActualizacion.toDate(),
                    activo: data.activo
                });
            });

            return recyclers;
        } catch (error) {
            console.error('Error getting active recyclers:', error);
            throw new Error('Error al obtener los recicladores activos');
        }
    }

    /**
     * Buscar recicladores por ubicación (dentro de un radio)
     */
    static async findRecyclersByLocation(lat: number, lng: number, maxDistance: number = 5000): Promise<IRecycler[]> {
        try {
            // Nota: Esta es una implementación básica. Para una búsqueda geoespacial más eficiente,
            // se recomienda usar GeoFirestore o implementar índices geoespaciales
            const allRecyclers = await this.getAllActiveRecyclers();
            
            const nearbyRecyclers = allRecyclers.filter(recycler => {
                return recycler.zonasCobertura.some(zona => {
                    const distance = this.calculateDistance(lat, lng, zona.lat, zona.lng);
                    return distance <= Math.min(maxDistance, zona.radio);
                });
            });

            return nearbyRecyclers;
        } catch (error) {
            console.error('Error finding recyclers by location:', error);
            throw new Error('Error al buscar recicladores por ubicación');
        }
    }

    /**
     * Calcular distancia entre dos puntos usando la fórmula de Haversine
     */
    private static calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
        const R = 6371000; // Radio de la Tierra en metros
        const dLat = this.toRadians(lat2 - lat1);
        const dLng = this.toRadians(lng2 - lng1);
        
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Convertir grados a radianes
     */
    private static toRadians(degrees: number): number {
        return degrees * (Math.PI / 180);
    }
}
