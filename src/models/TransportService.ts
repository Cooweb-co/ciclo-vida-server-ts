// src/models/TransportService.ts
import { 
    collection, 
    doc, 
    addDoc,
    getDoc, 
    getDocs,
    updateDoc,
    deleteDoc, 
    query,
    where,
    orderBy,
    limit,
    Timestamp,
    serverTimestamp
} from 'firebase/firestore';
import { db } from './FirebaseService';
import { calculateDistance } from '../config/googleMaps.config';
import { 
    ITransport, 
    ICreateTransportRequest, 
    IUpdateTransportRequest,
    IPuntoRuta,
    EstadoRuta,
    ITransportConEstado
} from '../types/transport.types';

export class TransportService {
    private static readonly COLLECTION_NAME = 'transport';

    /**
     * Crear o asignar una nueva ruta a un reciclador
     */
    static async createTransportRoute(transportData: ICreateTransportRequest): Promise<ITransport> {
        try {
            // Verificar si ya existe una ruta activa para este reciclador
            const existingRoute = await this.getTransportByRecyclerId(transportData.recicladorId);
            
            if (existingRoute) {
                // Si existe, actualizar la ruta existente
                return await this.updateTransportRoute(existingRoute.id, {
                    puntos: transportData.puntos
                });
            }

            // Validar y ordenar puntos
            const puntosOrdenados = this.validateAndSortPoints(transportData.puntos);
            
            // Calcular estadísticas de la ruta
            const stats = this.calculateRouteStats(puntosOrdenados);

            const transportCollection = collection(db, this.COLLECTION_NAME);
            
            const now = new Date();
            const newTransport = {
                recicladorId: transportData.recicladorId,
                puntos: puntosOrdenados,
                fechaCreacion: Timestamp.fromDate(now),
                fechaActualizacion: Timestamp.fromDate(now),
                activo: true,
                distanciaTotal: stats.distanciaTotal,
                tiempoEstimado: stats.tiempoEstimado
            };

            const docRef = await addDoc(transportCollection, newTransport);

            return {
                id: docRef.id,
                recicladorId: transportData.recicladorId,
                puntos: puntosOrdenados,
                fechaCreacion: now,
                fechaActualizacion: now,
                activo: true,
                distanciaTotal: stats.distanciaTotal,
                tiempoEstimado: stats.tiempoEstimado
            };
        } catch (error) {
            console.error('Error creating transport route:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Error al crear la ruta de transporte');
        }
    }

    /**
     * Obtener la ruta asignada a un reciclador
     */
    static async getTransportByRecyclerId(recicladorId: string): Promise<ITransport | null> {
        try {
            const transportCollection = collection(db, this.COLLECTION_NAME);
            const transportQuery = query(
                transportCollection,
                where('recicladorId', '==', recicladorId),
                where('activo', '==', true),
                orderBy('fechaCreacion', 'desc'),
                limit(1)
            );

            const querySnapshot = await getDocs(transportQuery);
            
            if (querySnapshot.empty) {
                return null;
            }

            const doc = querySnapshot.docs[0];
            const data = doc.data();

            return {
                id: doc.id,
                recicladorId: data.recicladorId,
                puntos: data.puntos,
                fechaCreacion: data.fechaCreacion.toDate(),
                fechaActualizacion: data.fechaActualizacion.toDate(),
                activo: data.activo,
                distanciaTotal: data.distanciaTotal,
                tiempoEstimado: data.tiempoEstimado
            };
        } catch (error) {
            console.error('Error getting transport route:', error);
            throw new Error('Error al obtener la ruta de transporte');
        }
    }

    /**
     * Actualizar una ruta existente
     */
    static async updateTransportRoute(transportId: string, updateData: IUpdateTransportRequest): Promise<ITransport> {
        try {
            const transportRef = doc(db, this.COLLECTION_NAME, transportId);
            
            // Verificar si la ruta existe
            const existingTransport = await getDoc(transportRef);
            if (!existingTransport.exists()) {
                throw new Error('Ruta de transporte no encontrada');
            }

            // Validar y ordenar puntos
            const puntosOrdenados = this.validateAndSortPoints(updateData.puntos);
            
            // Calcular estadísticas de la ruta
            const stats = this.calculateRouteStats(puntosOrdenados);

            const updatePayload = {
                puntos: puntosOrdenados,
                fechaActualizacion: serverTimestamp(),
                distanciaTotal: stats.distanciaTotal,
                tiempoEstimado: stats.tiempoEstimado
            };

            await updateDoc(transportRef, updatePayload);

            // Obtener el documento actualizado
            const updatedTransport = await getDoc(transportRef);
            const data = updatedTransport.data()!;

            return {
                id: updatedTransport.id,
                recicladorId: data.recicladorId,
                puntos: data.puntos,
                fechaCreacion: data.fechaCreacion.toDate(),
                fechaActualizacion: data.fechaActualizacion.toDate(),
                activo: data.activo,
                distanciaTotal: data.distanciaTotal,
                tiempoEstimado: data.tiempoEstimado
            };
        } catch (error) {
            console.error('Error updating transport route:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Error al actualizar la ruta de transporte');
        }
    }

    /**
     * Desactivar una ruta de transporte
     */
    static async deactivateTransportRoute(transportId: string): Promise<boolean> {
        try {
            const transportRef = doc(db, this.COLLECTION_NAME, transportId);
            
            // Verificar si la ruta existe
            const existingTransport = await getDoc(transportRef);
            if (!existingTransport.exists()) {
                return false;
            }

            await updateDoc(transportRef, {
                activo: false,
                fechaActualizacion: serverTimestamp()
            });

            return true;
        } catch (error) {
            console.error('Error deactivating transport route:', error);
            throw new Error('Error al desactivar la ruta de transporte');
        }
    }

    /**
     * Obtener todas las rutas activas
     */
    static async getAllActiveRoutes(): Promise<ITransport[]> {
        try {
            const transportCollection = collection(db, this.COLLECTION_NAME);
            const activeRoutesQuery = query(
                transportCollection,
                where('activo', '==', true),
                orderBy('fechaCreacion', 'desc')
            );

            const querySnapshot = await getDocs(activeRoutesQuery);
            const routes: ITransport[] = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                routes.push({
                    id: doc.id,
                    recicladorId: data.recicladorId,
                    puntos: data.puntos,
                    fechaCreacion: data.fechaCreacion.toDate(),
                    fechaActualizacion: data.fechaActualizacion.toDate(),
                    activo: data.activo,
                    distanciaTotal: data.distanciaTotal,
                    tiempoEstimado: data.tiempoEstimado
                });
            });

            return routes;
        } catch (error) {
            console.error('Error getting active routes:', error);
            throw new Error('Error al obtener las rutas activas');
        }
    }

    /**
     * Obtener estadísticas de una ruta
     */
    static async getRouteStats(transportId: string): Promise<{
        totalPuntos: number;
        distanciaTotal: number;
        tiempoEstimado: number;
        puntosOrdenados: IPuntoRuta[];
    }> {
        try {
            const transportRef = doc(db, this.COLLECTION_NAME, transportId);
            const transportSnap = await getDoc(transportRef);

            if (!transportSnap.exists()) {
                throw new Error('Ruta de transporte no encontrada');
            }

            const data = transportSnap.data();
            const puntos = data.puntos as IPuntoRuta[];

            return {
                totalPuntos: puntos.length,
                distanciaTotal: data.distanciaTotal || 0,
                tiempoEstimado: data.tiempoEstimado || 0,
                puntosOrdenados: puntos.sort((a, b) => a.orden - b.orden)
            };
        } catch (error) {
            console.error('Error getting route stats:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Error al obtener las estadísticas de la ruta');
        }
    }

    /**
     * Optimizar ruta usando algoritmo simple (ordenar por proximidad)
     */
    static async optimizeRoute(transportId: string, puntoInicio?: IPuntoRuta): Promise<ITransport> {
        try {
            const transportRef = doc(db, this.COLLECTION_NAME, transportId);
            const transportSnap = await getDoc(transportRef);

            if (!transportSnap.exists()) {
                throw new Error('Ruta de transporte no encontrada');
            }

            const data = transportSnap.data();
            let puntos = [...data.puntos] as IPuntoRuta[];

            // Si no se proporciona punto de inicio, usar el primer punto actual
            const inicio = puntoInicio || puntos[0];
            
            // Algoritmo simple de optimización: vecino más cercano
            const puntosOptimizados = this.optimizePointsOrder(puntos, inicio);
            
            // Recalcular estadísticas
            const stats = this.calculateRouteStats(puntosOptimizados);

            // Actualizar la ruta
            await updateDoc(transportRef, {
                puntos: puntosOptimizados,
                fechaActualizacion: serverTimestamp(),
                distanciaTotal: stats.distanciaTotal,
                tiempoEstimado: stats.tiempoEstimado
            });

            // Retornar la ruta actualizada
            const updatedTransport = await getDoc(transportRef);
            const updatedData = updatedTransport.data()!;

            return {
                id: updatedTransport.id,
                recicladorId: updatedData.recicladorId,
                puntos: updatedData.puntos,
                fechaCreacion: updatedData.fechaCreacion.toDate(),
                fechaActualizacion: updatedData.fechaActualizacion.toDate(),
                activo: updatedData.activo,
                distanciaTotal: updatedData.distanciaTotal,
                tiempoEstimado: updatedData.tiempoEstimado
            };
        } catch (error) {
            console.error('Error optimizing route:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Error al optimizar la ruta');
        }
    }

    /**
     * Validar y ordenar puntos de la ruta
     */
    private static validateAndSortPoints(puntos: IPuntoRuta[]): IPuntoRuta[] {
        if (!Array.isArray(puntos) || puntos.length === 0) {
            throw new Error('Debe proporcionar al menos un punto en la ruta');
        }

        // Validar cada punto
        puntos.forEach((punto, index) => {
            if (typeof punto.lat !== 'number' || typeof punto.lng !== 'number') {
                throw new Error(`Coordenadas inválidas en el punto ${index + 1}`);
            }

            if (punto.lat < -90 || punto.lat > 90 || punto.lng < -180 || punto.lng > 180) {
                throw new Error(`Coordenadas fuera de rango en el punto ${index + 1}`);
            }

            if (typeof punto.orden !== 'number' || punto.orden < 0) {
                throw new Error(`Orden inválido en el punto ${index + 1}`);
            }
        });

        // Ordenar por orden y reasignar números de orden consecutivos
        const puntosOrdenados = [...puntos].sort((a, b) => a.orden - b.orden);
        
        return puntosOrdenados.map((punto, index) => ({
            ...punto,
            orden: index + 1
        }));
    }

    /**
     * Calcular estadísticas de la ruta (distancia total y tiempo estimado)
     */
    private static calculateRouteStats(puntos: IPuntoRuta[]): {
        distanciaTotal: number;
        tiempoEstimado: number;
    } {
        if (puntos.length < 2) {
            return { distanciaTotal: 0, tiempoEstimado: 0 };
        }

        let distanciaTotal = 0;

        for (let i = 0; i < puntos.length - 1; i++) {
            const puntoActual = puntos[i];
            const puntoSiguiente = puntos[i + 1];
            
            const distancia = calculateDistance(
                puntoActual.lat,
                puntoActual.lng,
                puntoSiguiente.lat,
                puntoSiguiente.lng
            );
            
            distanciaTotal += distancia;
        }

        // Estimar tiempo basado en velocidad promedio de 30 km/h en ciudad
        const velocidadPromedio = 30; // km/h
        const tiempoEstimado = Math.round((distanciaTotal / 1000) / velocidadPromedio * 60); // minutos

        return {
            distanciaTotal: Math.round(distanciaTotal),
            tiempoEstimado
        };
    }

    /**
     * Optimizar orden de puntos usando algoritmo del vecino más cercano
     */
    private static optimizePointsOrder(puntos: IPuntoRuta[], puntoInicio: IPuntoRuta): IPuntoRuta[] {
        if (puntos.length <= 2) {
            return puntos.map((punto, index) => ({ ...punto, orden: index + 1 }));
        }

        const puntosRestantes = [...puntos];
        const rutaOptimizada: IPuntoRuta[] = [];
        
        // Encontrar el punto de inicio más cercano
        let puntoActual = puntoInicio;
        let indiceActual = puntosRestantes.findIndex(p => 
            p.lat === puntoActual.lat && p.lng === puntoActual.lng
        );
        
        if (indiceActual === -1) {
            // Si no se encuentra el punto de inicio exacto, usar el más cercano
            let distanciaMinima = Infinity;
            indiceActual = 0;
            
            puntosRestantes.forEach((punto, index) => {
                const distancia = calculateDistance(
                    puntoInicio.lat, puntoInicio.lng,
                    punto.lat, punto.lng
                );
                if (distancia < distanciaMinima) {
                    distanciaMinima = distancia;
                    indiceActual = index;
                }
            });
        }

        // Algoritmo del vecino más cercano
        while (puntosRestantes.length > 0) {
            puntoActual = puntosRestantes.splice(indiceActual, 1)[0];
            rutaOptimizada.push(puntoActual);

            if (puntosRestantes.length === 0) break;

            // Encontrar el siguiente punto más cercano
            let distanciaMinima = Infinity;
            indiceActual = 0;

            puntosRestantes.forEach((punto, index) => {
                const distancia = calculateDistance(
                    puntoActual.lat, puntoActual.lng,
                    punto.lat, punto.lng
                );
                if (distancia < distanciaMinima) {
                    distanciaMinima = distancia;
                    indiceActual = index;
                }
            });
        }

        // Reasignar órdenes
        return rutaOptimizada.map((punto, index) => ({
            ...punto,
            orden: index + 1
        }));
    }
}
