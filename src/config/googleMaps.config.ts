// src/config/googleMaps.config.ts
import { Client } from '@googlemaps/google-maps-services-js';

/**
 * Configuración de Google Maps API
 * 
 * IMPORTANTE: Configura tu API Key de Google Maps aquí
 * 
 * Para obtener una API Key:
 * 1. Ve a Google Cloud Console (https://console.cloud.google.com/)
 * 2. Crea un nuevo proyecto o selecciona uno existente
 * 3. Habilita las siguientes APIs:
 *    - Maps JavaScript API
 *    - Geocoding API
 *    - Places API (opcional)
 * 4. Ve a "Credenciales" y crea una API Key
 * 5. Configura las restricciones de la API Key según tus necesidades
 * 
 * SEGURIDAD: En producción, usa variables de entorno para la API Key
 */

// 🔑 CONFIGURA TU API KEY DE GOOGLE MAPS AQUÍ
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || 'TU_API_KEY_AQUI';

// Verificar que la API Key esté configurada
if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'TU_API_KEY_AQUI') {
    console.warn('⚠️  ADVERTENCIA: Google Maps API Key no está configurada correctamente');
    console.warn('   Configura la variable de entorno GOOGLE_MAPS_API_KEY o edita el archivo googleMaps.config.ts');
}

// Cliente de Google Maps
export const googleMapsClient = new Client({});

// Configuración de la API Key
export const getGoogleMapsApiKey = (): string => {
    return GOOGLE_MAPS_API_KEY;
};

// Configuración por defecto para validación de ubicaciones
export const LOCATION_VALIDATION_CONFIG = {
    DEFAULT_RADIUS: 100, // Radio por defecto en metros para validación
    MAX_RADIUS: 10000,   // Radio máximo permitido en metros
    MIN_RADIUS: 10       // Radio mínimo permitido en metros
};

// Función para calcular distancia usando Google Maps Geometry
export const calculateDistance = (
    lat1: number, 
    lng1: number, 
    lat2: number, 
    lng2: number
): number => {
    // Fórmula de Haversine para calcular distancia entre dos puntos
    const R = 6371000; // Radio de la Tierra en metros
    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// Función auxiliar para convertir grados a radianes
const toRadians = (degrees: number): number => {
    return degrees * (Math.PI / 180);
};

// Función para validar coordenadas
export const isValidCoordinate = (lat: number, lng: number): boolean => {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

// Función para geocodificar una dirección (opcional, para futuras funcionalidades)
export const geocodeAddress = async (address: string) => {
    try {
        const response = await googleMapsClient.geocode({
            params: {
                address,
                key: getGoogleMapsApiKey(),
            },
        });

        if (response.data.results.length > 0) {
            const result = response.data.results[0];
            return {
                lat: result.geometry.location.lat,
                lng: result.geometry.location.lng,
                formatted_address: result.formatted_address
            };
        }
        
        return null;
    } catch (error) {
        console.error('Error geocoding address:', error);
        throw new Error('Error al geocodificar la dirección');
    }
};
