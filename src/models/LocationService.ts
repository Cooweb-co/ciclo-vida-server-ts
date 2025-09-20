// src/models/LocationService.ts
import { 
    collection, 
    doc, 
    addDoc,
    getDoc, 
    getDocs,
    deleteDoc, 
    query,
    where,
    orderBy,
    Timestamp,
    serverTimestamp
} from 'firebase/firestore';
import { db } from './FirebaseService';
import { 
    calculateDistance, 
    isValidCoordinate,
    LOCATION_VALIDATION_CONFIG 
} from '../config/googleMaps.config';
import { 
    ILocation, 
    ICreateLocationRequest, 
    TipoLocation,
    IValidateLocationQuery
} from '../types/location.types';

export class LocationService {
    private static readonly COLLECTION_NAME = 'locations';

    /**
     * Crear una nueva ubicación
     */
    static async createLocation(locationData: ICreateLocationRequest): Promise<ILocation> {
        try {
            // Validar coordenadas
            if (!isValidCoordinate(locationData.lat, locationData.lng)) {
                throw new Error('Coordenadas inválidas');
            }

            const locationsCollection = collection(db, this.COLLECTION_NAME);
            
            const now = new Date();
            const newLocation = {
                nombre: locationData.nombre,
                lat: locationData.lat,
                lng: locationData.lng,
                tipo: locationData.tipo,
                fechaCreacion: Timestamp.fromDate(now),
                fechaActualizacion: Timestamp.fromDate(now),
                activo: true
            };

            const docRef = await addDoc(locationsCollection, newLocation);

            return {
                id: docRef.id,
                nombre: locationData.nombre,
                lat: locationData.lat,
                lng: locationData.lng,
                tipo: locationData.tipo,
                fechaCreacion: now,
                fechaActualizacion: now,
                activo: true
            };
        } catch (error) {
            console.error('Error creating location:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Error al crear la ubicación');
        }
    }

    /**
     * Obtener todas las ubicaciones activas
     */
    static async getAllLocations(): Promise<ILocation[]> {
        try {
            const locationsCollection = collection(db, this.COLLECTION_NAME);
            const activeLocationsQuery = query(
                locationsCollection,
                where('activo', '==', true),
                orderBy('fechaCreacion', 'desc')
            );

            const querySnapshot = await getDocs(activeLocationsQuery);
            const locations: ILocation[] = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                locations.push({
                    id: doc.id,
                    nombre: data.nombre,
                    lat: data.lat,
                    lng: data.lng,
                    tipo: data.tipo as TipoLocation,
                    fechaCreacion: data.fechaCreacion.toDate(),
                    fechaActualizacion: data.fechaActualizacion.toDate(),
                    activo: data.activo
                });
            });

            return locations;
        } catch (error) {
            console.error('Error getting locations:', error);
            throw new Error('Error al obtener las ubicaciones');
        }
    }

    /**
     * Obtener una ubicación por ID
     */
    static async getLocationById(id: string): Promise<ILocation | null> {
        try {
            const locationRef = doc(db, this.COLLECTION_NAME, id);
            const locationSnap = await getDoc(locationRef);

            if (!locationSnap.exists()) {
                return null;
            }

            const data = locationSnap.data();
            return {
                id: locationSnap.id,
                nombre: data.nombre,
                lat: data.lat,
                lng: data.lng,
                tipo: data.tipo as TipoLocation,
                fechaCreacion: data.fechaCreacion.toDate(),
                fechaActualizacion: data.fechaActualizacion.toDate(),
                activo: data.activo
            };
        } catch (error) {
            console.error('Error getting location:', error);
            throw new Error('Error al obtener la ubicación');
        }
    }

    /**
     * Eliminar una ubicación
     */
    static async deleteLocation(id: string): Promise<boolean> {
        try {
            const locationRef = doc(db, this.COLLECTION_NAME, id);
            
            // Verificar si la ubicación existe
            const existingLocation = await getDoc(locationRef);
            if (!existingLocation.exists()) {
                return false;
            }

            await deleteDoc(locationRef);
            return true;
        } catch (error) {
            console.error('Error deleting location:', error);
            throw new Error('Error al eliminar la ubicación');
        }
    }

    /**
     * Validar si un punto está registrado o está dentro de un radio
     */
    static async validateLocation(params: IValidateLocationQuery): Promise<{
        isValid: boolean;
        nearbyLocations: ILocation[];
        closestLocation?: ILocation;
        distance?: number;
    }> {
        try {
            // Validar coordenadas de entrada
            if (!isValidCoordinate(params.lat, params.lng)) {
                throw new Error('Coordenadas inválidas');
            }

            const radio = params.radio || LOCATION_VALIDATION_CONFIG.DEFAULT_RADIUS;
            
            // Validar radio
            if (radio < LOCATION_VALIDATION_CONFIG.MIN_RADIUS || 
                radio > LOCATION_VALIDATION_CONFIG.MAX_RADIUS) {
                throw new Error(`El radio debe estar entre ${LOCATION_VALIDATION_CONFIG.MIN_RADIUS} y ${LOCATION_VALIDATION_CONFIG.MAX_RADIUS} metros`);
            }

            // Obtener todas las ubicaciones activas
            const allLocations = await this.getAllLocations();
            
            // Calcular distancias y filtrar ubicaciones cercanas
            const locationsWithDistance = allLocations.map(location => ({
                location,
                distance: calculateDistance(params.lat, params.lng, location.lat, location.lng)
            }));

            // Filtrar ubicaciones dentro del radio
            const nearbyLocations = locationsWithDistance
                .filter(item => item.distance <= radio)
                .map(item => item.location);

            // Encontrar la ubicación más cercana
            let closestLocation: ILocation | undefined;
            let minDistance: number | undefined;

            if (locationsWithDistance.length > 0) {
                const closest = locationsWithDistance.reduce((prev, current) => 
                    prev.distance < current.distance ? prev : current
                );
                closestLocation = closest.location;
                minDistance = closest.distance;
            }

            // Determinar si es válido (hay ubicaciones dentro del radio)
            const isValid = nearbyLocations.length > 0;

            return {
                isValid,
                nearbyLocations,
                closestLocation,
                distance: minDistance
            };
        } catch (error) {
            console.error('Error validating location:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Error al validar la ubicación');
        }
    }

    /**
     * Buscar ubicaciones por tipo
     */
    static async getLocationsByType(tipo: TipoLocation): Promise<ILocation[]> {
        try {
            const locationsCollection = collection(db, this.COLLECTION_NAME);
            const typeQuery = query(
                locationsCollection,
                where('activo', '==', true),
                where('tipo', '==', tipo),
                orderBy('fechaCreacion', 'desc')
            );

            const querySnapshot = await getDocs(typeQuery);
            const locations: ILocation[] = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                locations.push({
                    id: doc.id,
                    nombre: data.nombre,
                    lat: data.lat,
                    lng: data.lng,
                    tipo: data.tipo as TipoLocation,
                    fechaCreacion: data.fechaCreacion.toDate(),
                    fechaActualizacion: data.fechaActualizacion.toDate(),
                    activo: data.activo
                });
            });

            return locations;
        } catch (error) {
            console.error('Error getting locations by type:', error);
            throw new Error('Error al obtener ubicaciones por tipo');
        }
    }

    /**
     * Buscar ubicaciones dentro de un área específica
     */
    static async getLocationsInArea(
        centerLat: number, 
        centerLng: number, 
        radiusMeters: number
    ): Promise<ILocation[]> {
        try {
            // Validar coordenadas
            if (!isValidCoordinate(centerLat, centerLng)) {
                throw new Error('Coordenadas del centro inválidas');
            }

            if (radiusMeters < LOCATION_VALIDATION_CONFIG.MIN_RADIUS || 
                radiusMeters > LOCATION_VALIDATION_CONFIG.MAX_RADIUS) {
                throw new Error(`El radio debe estar entre ${LOCATION_VALIDATION_CONFIG.MIN_RADIUS} y ${LOCATION_VALIDATION_CONFIG.MAX_RADIUS} metros`);
            }

            // Obtener todas las ubicaciones activas
            const allLocations = await this.getAllLocations();
            
            // Filtrar ubicaciones dentro del radio
            const locationsInArea = allLocations.filter(location => {
                const distance = calculateDistance(centerLat, centerLng, location.lat, location.lng);
                return distance <= radiusMeters;
            });

            // Ordenar por distancia (más cercanas primero)
            locationsInArea.sort((a, b) => {
                const distanceA = calculateDistance(centerLat, centerLng, a.lat, a.lng);
                const distanceB = calculateDistance(centerLat, centerLng, b.lat, b.lng);
                return distanceA - distanceB;
            });

            return locationsInArea;
        } catch (error) {
            console.error('Error getting locations in area:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Error al obtener ubicaciones en el área');
        }
    }
}
