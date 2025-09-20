// src/controllers/location.controller.ts
import { Request, Response } from 'express';
import { LocationService } from '../models/LocationService';
import { 
    ICreateLocationRequest, 
    TipoLocation,
    IValidateLocationQuery
} from '../types/location.types';
import { LOCATION_VALIDATION_CONFIG } from '../config/googleMaps.config';

export class LocationController {
    /**
     * Validar si un punto está registrado o está dentro de un radio
     * GET /locations/validate?lat=x&lng=y&radio=z
     */
    static async validateLocation(req: Request, res: Response): Promise<void> {
        try {
            const { lat, lng, radio } = req.query;

            // Validar parámetros requeridos
            if (!lat || !lng) {
                res.status(400).json({ 
                    success: false,
                    error: 'Los parámetros lat y lng son requeridos' 
                });
                return;
            }

            // Convertir y validar tipos
            const latitude = parseFloat(lat as string);
            const longitude = parseFloat(lng as string);
            const radiusMeters = radio ? parseInt(radio as string, 10) : LOCATION_VALIDATION_CONFIG.DEFAULT_RADIUS;

            if (isNaN(latitude) || isNaN(longitude)) {
                res.status(400).json({ 
                    success: false,
                    error: 'Los parámetros lat y lng deben ser números válidos' 
                });
                return;
            }

            if (radio && isNaN(radiusMeters)) {
                res.status(400).json({ 
                    success: false,
                    error: 'El parámetro radio debe ser un número válido' 
                });
                return;
            }

            // Validar rangos de coordenadas
            if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
                res.status(400).json({ 
                    success: false,
                    error: 'Coordenadas inválidas' 
                });
                return;
            }

            // Validar radio
            if (radiusMeters < LOCATION_VALIDATION_CONFIG.MIN_RADIUS || 
                radiusMeters > LOCATION_VALIDATION_CONFIG.MAX_RADIUS) {
                res.status(400).json({ 
                    success: false,
                    error: `El radio debe estar entre ${LOCATION_VALIDATION_CONFIG.MIN_RADIUS} y ${LOCATION_VALIDATION_CONFIG.MAX_RADIUS} metros` 
                });
                return;
            }

            const validationParams: IValidateLocationQuery = {
                lat: latitude,
                lng: longitude,
                radio: radiusMeters
            };

            const result = await LocationService.validateLocation(validationParams);

            res.status(200).json({
                success: true,
                data: result,
                searchParams: {
                    lat: latitude,
                    lng: longitude,
                    radio: radiusMeters
                }
            });
        } catch (error) {
            console.error('Error in validateLocation:', error);
            res.status(500).json({ 
                success: false,
                error: 'Error interno del servidor',
                message: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    /**
     * Listar todas las ubicaciones
     * GET /locations
     */
    static async getAllLocations(req: Request, res: Response): Promise<void> {
        try {
            const { tipo } = req.query;

            let locations;

            if (tipo) {
                // Validar tipo si se proporciona
                if (!Object.values(TipoLocation).includes(tipo as TipoLocation)) {
                    res.status(400).json({ 
                        success: false,
                        error: 'Tipo de ubicación inválido',
                        validTypes: Object.values(TipoLocation)
                    });
                    return;
                }

                locations = await LocationService.getLocationsByType(tipo as TipoLocation);
            } else {
                locations = await LocationService.getAllLocations();
            }

            res.status(200).json({
                success: true,
                data: locations,
                count: locations.length
            });
        } catch (error) {
            console.error('Error in getAllLocations:', error);
            res.status(500).json({ 
                success: false,
                error: 'Error interno del servidor',
                message: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    /**
     * Registrar un nuevo punto
     * POST /locations
     */
    static async createLocation(req: Request, res: Response): Promise<void> {
        try {
            const locationData: ICreateLocationRequest = req.body;

            // Validaciones
            const validationError = LocationController.validateCreateLocationData(locationData);
            if (validationError) {
                res.status(400).json({ 
                    success: false,
                    error: 'Datos de entrada inválidos', 
                    details: validationError 
                });
                return;
            }

            // Crear la ubicación
            const newLocation = await LocationService.createLocation(locationData);

            res.status(201).json({
                success: true,
                message: 'Ubicación creada exitosamente',
                data: newLocation
            });
        } catch (error) {
            console.error('Error in createLocation:', error);
            res.status(500).json({ 
                success: false,
                error: 'Error interno del servidor',
                message: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    /**
     * Eliminar un punto
     * DELETE /locations/:id
     */
    static async deleteLocation(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            // Validar ID
            if (!id || id.trim() === '') {
                res.status(400).json({ 
                    success: false,
                    error: 'ID de ubicación inválido' 
                });
                return;
            }

            const deleted = await LocationService.deleteLocation(id);

            if (!deleted) {
                res.status(404).json({ 
                    success: false,
                    error: 'Ubicación no encontrada' 
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'Ubicación eliminada exitosamente'
            });
        } catch (error) {
            console.error('Error in deleteLocation:', error);
            res.status(500).json({ 
                success: false,
                error: 'Error interno del servidor',
                message: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    /**
     * Obtener una ubicación por ID
     * GET /locations/:id
     */
    static async getLocationById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            // Validar ID
            if (!id || id.trim() === '') {
                res.status(400).json({ 
                    success: false,
                    error: 'ID de ubicación inválido' 
                });
                return;
            }

            const location = await LocationService.getLocationById(id);

            if (!location) {
                res.status(404).json({ 
                    success: false,
                    error: 'Ubicación no encontrada' 
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: location
            });
        } catch (error) {
            console.error('Error in getLocationById:', error);
            res.status(500).json({ 
                success: false,
                error: 'Error interno del servidor',
                message: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    /**
     * Buscar ubicaciones en un área específica
     * GET /locations/search/area?lat=x&lng=y&radius=z
     */
    static async getLocationsInArea(req: Request, res: Response): Promise<void> {
        try {
            const { lat, lng, radius } = req.query;

            // Validar parámetros requeridos
            if (!lat || !lng || !radius) {
                res.status(400).json({ 
                    success: false,
                    error: 'Los parámetros lat, lng y radius son requeridos' 
                });
                return;
            }

            // Convertir y validar tipos
            const latitude = parseFloat(lat as string);
            const longitude = parseFloat(lng as string);
            const radiusMeters = parseInt(radius as string, 10);

            if (isNaN(latitude) || isNaN(longitude) || isNaN(radiusMeters)) {
                res.status(400).json({ 
                    success: false,
                    error: 'Los parámetros deben ser números válidos' 
                });
                return;
            }

            // Validar rangos
            if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
                res.status(400).json({ 
                    success: false,
                    error: 'Coordenadas inválidas' 
                });
                return;
            }

            if (radiusMeters < LOCATION_VALIDATION_CONFIG.MIN_RADIUS || 
                radiusMeters > LOCATION_VALIDATION_CONFIG.MAX_RADIUS) {
                res.status(400).json({ 
                    success: false,
                    error: `El radio debe estar entre ${LOCATION_VALIDATION_CONFIG.MIN_RADIUS} y ${LOCATION_VALIDATION_CONFIG.MAX_RADIUS} metros` 
                });
                return;
            }

            const locations = await LocationService.getLocationsInArea(latitude, longitude, radiusMeters);

            res.status(200).json({
                success: true,
                data: locations,
                count: locations.length,
                searchParams: {
                    lat: latitude,
                    lng: longitude,
                    radius: radiusMeters
                }
            });
        } catch (error) {
            console.error('Error in getLocationsInArea:', error);
            res.status(500).json({ 
                success: false,
                error: 'Error interno del servidor',
                message: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    /**
     * Validar datos para crear una ubicación
     */
    private static validateCreateLocationData(data: any): string | null {
        if (!data) {
            return 'Los datos de la ubicación son requeridos';
        }

        if (!data.nombre || typeof data.nombre !== 'string' || data.nombre.trim() === '') {
            return 'El nombre es requerido y debe ser una cadena válida';
        }

        if (data.nombre.trim().length < 2 || data.nombre.trim().length > 100) {
            return 'El nombre debe tener entre 2 y 100 caracteres';
        }

        if (typeof data.lat !== 'number' || isNaN(data.lat)) {
            return 'La latitud debe ser un número válido';
        }

        if (data.lat < -90 || data.lat > 90) {
            return 'La latitud debe estar entre -90 y 90';
        }

        if (typeof data.lng !== 'number' || isNaN(data.lng)) {
            return 'La longitud debe ser un número válido';
        }

        if (data.lng < -180 || data.lng > 180) {
            return 'La longitud debe estar entre -180 y 180';
        }

        if (!data.tipo || typeof data.tipo !== 'string') {
            return 'El tipo es requerido y debe ser una cadena';
        }

        if (!Object.values(TipoLocation).includes(data.tipo as TipoLocation)) {
            return `Tipo inválido. Los tipos válidos son: ${Object.values(TipoLocation).join(', ')}`;
        }

        return null;
    }
}
