// src/controllers/recycler.controller.ts
import { Request, Response } from 'express';
import { RecyclerService } from '../models/RecyclerService';
import { 
    ICreateRecyclerRequest, 
    IUpdateRecyclerRequest, 
    IZonaCobertura, 
    IInfoBase 
} from '../types/recycler.types';

export class RecyclerController {
    /**
     * Crear un nuevo reciclador
     * POST /recyclers
     */
    static async createRecycler(req: Request, res: Response): Promise<void> {
        try {
            const recyclerData: ICreateRecyclerRequest = req.body;

            // Validaciones
            const validationError = RecyclerController.validateCreateRecyclerData(recyclerData);
            if (validationError) {
                res.status(400).json({ 
                    success: false,
                    error: 'Datos de entrada inválidos', 
                    details: validationError 
                });
                return;
            }

            // Crear el reciclador
            const newRecycler = await RecyclerService.createRecycler(recyclerData);

            res.status(201).json({
                success: true,
                message: 'Reciclador creado exitosamente',
                data: newRecycler
            });
        } catch (error) {
            console.error('Error in createRecycler:', error);
            
            if (error instanceof Error && error.message === 'El reciclador ya existe') {
                res.status(409).json({ 
                    success: false,
                    error: 'Conflicto',
                    message: error.message
                });
                return;
            }

            res.status(500).json({ 
                success: false,
                error: 'Error interno del servidor',
                message: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    /**
     * Obtener un reciclador por ID
     * GET /recyclers/:id
     */
    static async getRecyclerById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            // Validar ID
            if (!id || id.trim() === '') {
                res.status(400).json({ 
                    success: false,
                    error: 'ID de reciclador inválido' 
                });
                return;
            }

            const recycler = await RecyclerService.getRecyclerById(id);

            if (!recycler) {
                res.status(404).json({ 
                    success: false,
                    error: 'Reciclador no encontrado' 
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: recycler
            });
        } catch (error) {
            console.error('Error in getRecyclerById:', error);
            res.status(500).json({ 
                success: false,
                error: 'Error interno del servidor',
                message: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    /**
     * Actualizar un reciclador
     * PUT /recyclers/:id
     */
    static async updateRecycler(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const updateData: IUpdateRecyclerRequest = req.body;

            // Validar ID
            if (!id || id.trim() === '') {
                res.status(400).json({ 
                    success: false,
                    error: 'ID de reciclador inválido' 
                });
                return;
            }

            // Validar datos de actualización
            const validationError = RecyclerController.validateUpdateRecyclerData(updateData);
            if (validationError) {
                res.status(400).json({ 
                    success: false,
                    error: 'Datos de entrada inválidos', 
                    details: validationError 
                });
                return;
            }

            const updatedRecycler = await RecyclerService.updateRecycler(id, updateData);

            if (!updatedRecycler) {
                res.status(404).json({ 
                    success: false,
                    error: 'Reciclador no encontrado' 
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'Reciclador actualizado exitosamente',
                data: updatedRecycler
            });
        } catch (error) {
            console.error('Error in updateRecycler:', error);
            res.status(500).json({ 
                success: false,
                error: 'Error interno del servidor',
                message: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    /**
     * Eliminar un reciclador
     * DELETE /recyclers/:id
     */
    static async deleteRecycler(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            // Validar ID
            if (!id || id.trim() === '') {
                res.status(400).json({ 
                    success: false,
                    error: 'ID de reciclador inválido' 
                });
                return;
            }

            const deleted = await RecyclerService.deleteRecycler(id);

            if (!deleted) {
                res.status(404).json({ 
                    success: false,
                    error: 'Reciclador no encontrado' 
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'Reciclador eliminado exitosamente'
            });
        } catch (error) {
            console.error('Error in deleteRecycler:', error);
            res.status(500).json({ 
                success: false,
                error: 'Error interno del servidor',
                message: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    /**
     * Obtener todos los recicladores activos
     * GET /recyclers
     */
    static async getAllActiveRecyclers(req: Request, res: Response): Promise<void> {
        try {
            const recyclers = await RecyclerService.getAllActiveRecyclers();

            res.status(200).json({
                success: true,
                data: recyclers,
                count: recyclers.length
            });
        } catch (error) {
            console.error('Error in getAllActiveRecyclers:', error);
            res.status(500).json({ 
                success: false,
                error: 'Error interno del servidor',
                message: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    /**
     * Buscar recicladores por ubicación
     * GET /recyclers/search/location?lat=X&lng=Y&maxDistance=Z
     */
    static async findRecyclersByLocation(req: Request, res: Response): Promise<void> {
        try {
            const { lat, lng, maxDistance } = req.query;

            // Validar parámetros
            if (!lat || !lng) {
                res.status(400).json({ 
                    success: false,
                    error: 'Los parámetros lat y lng son requeridos' 
                });
                return;
            }

            const latitude = parseFloat(lat as string);
            const longitude = parseFloat(lng as string);
            const maxDist = maxDistance ? parseInt(maxDistance as string, 10) : 5000;

            if (isNaN(latitude) || isNaN(longitude)) {
                res.status(400).json({ 
                    success: false,
                    error: 'Los parámetros lat y lng deben ser números válidos' 
                });
                return;
            }

            if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
                res.status(400).json({ 
                    success: false,
                    error: 'Coordenadas inválidas' 
                });
                return;
            }

            if (maxDist < 100 || maxDist > 50000) {
                res.status(400).json({ 
                    success: false,
                    error: 'La distancia máxima debe estar entre 100 y 50000 metros' 
                });
                return;
            }

            const recyclers = await RecyclerService.findRecyclersByLocation(latitude, longitude, maxDist);

            res.status(200).json({
                success: true,
                data: recyclers,
                count: recyclers.length,
                searchParams: {
                    lat: latitude,
                    lng: longitude,
                    maxDistance: maxDist
                }
            });
        } catch (error) {
            console.error('Error in findRecyclersByLocation:', error);
            res.status(500).json({ 
                success: false,
                error: 'Error interno del servidor',
                message: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    /**
     * Validar datos para crear un reciclador
     */
    private static validateCreateRecyclerData(data: any): string | null {
        if (!data) {
            return 'Los datos del reciclador son requeridos';
        }

        if (!data.id || typeof data.id !== 'string' || data.id.trim() === '') {
            return 'El ID del reciclador es requerido y debe ser una cadena válida';
        }

        if (!data.zonasCobertura || !Array.isArray(data.zonasCobertura)) {
            return 'Las zonas de cobertura son requeridas y deben ser un array';
        }

        if (data.zonasCobertura.length === 0) {
            return 'Debe especificar al menos una zona de cobertura';
        }

        // Validar cada zona de cobertura
        for (let i = 0; i < data.zonasCobertura.length; i++) {
            const zona = data.zonasCobertura[i];
            const zonaError = this.validateZonaCobertura(zona, i);
            if (zonaError) return zonaError;
        }

        if (!data.infoBase || typeof data.infoBase !== 'object') {
            return 'La información base es requerida y debe ser un objeto';
        }

        const infoBaseError = this.validateInfoBase(data.infoBase);
        if (infoBaseError) return infoBaseError;

        return null;
    }

    /**
     * Validar datos para actualizar un reciclador
     */
    private static validateUpdateRecyclerData(data: any): string | null {
        if (!data || Object.keys(data).length === 0) {
            return 'Debe proporcionar al menos un campo para actualizar';
        }

        if (data.zonasCobertura !== undefined) {
            if (!Array.isArray(data.zonasCobertura)) {
                return 'Las zonas de cobertura deben ser un array';
            }

            if (data.zonasCobertura.length === 0) {
                return 'Debe especificar al menos una zona de cobertura';
            }

            // Validar cada zona de cobertura
            for (let i = 0; i < data.zonasCobertura.length; i++) {
                const zona = data.zonasCobertura[i];
                const zonaError = this.validateZonaCobertura(zona, i);
                if (zonaError) return zonaError;
            }
        }

        if (data.infoBase !== undefined) {
            if (typeof data.infoBase !== 'object' || data.infoBase === null) {
                return 'La información base debe ser un objeto';
            }

            const infoBaseError = this.validateInfoBase(data.infoBase, true);
            if (infoBaseError) return infoBaseError;
        }

        if (data.activo !== undefined && typeof data.activo !== 'boolean') {
            return 'El campo activo debe ser un valor booleano';
        }

        return null;
    }

    /**
     * Validar una zona de cobertura
     */
    private static validateZonaCobertura(zona: any, index: number): string | null {
        if (!zona || typeof zona !== 'object') {
            return `La zona de cobertura ${index + 1} debe ser un objeto`;
        }

        if (typeof zona.lat !== 'number' || isNaN(zona.lat)) {
            return `La latitud de la zona ${index + 1} debe ser un número válido`;
        }

        if (zona.lat < -90 || zona.lat > 90) {
            return `La latitud de la zona ${index + 1} debe estar entre -90 y 90`;
        }

        if (typeof zona.lng !== 'number' || isNaN(zona.lng)) {
            return `La longitud de la zona ${index + 1} debe ser un número válido`;
        }

        if (zona.lng < -180 || zona.lng > 180) {
            return `La longitud de la zona ${index + 1} debe estar entre -180 y 180`;
        }

        if (typeof zona.radio !== 'number' || isNaN(zona.radio)) {
            return `El radio de la zona ${index + 1} debe ser un número válido`;
        }

        if (zona.radio < 100 || zona.radio > 50000) {
            return `El radio de la zona ${index + 1} debe estar entre 100 y 50000 metros`;
        }

        return null;
    }

    /**
     * Validar información base
     */
    private static validateInfoBase(infoBase: any, isUpdate: boolean = false): string | null {
        if (!isUpdate) {
            if (!infoBase.nombre || typeof infoBase.nombre !== 'string' || infoBase.nombre.trim() === '') {
                return 'El nombre es requerido y debe ser una cadena válida';
            }

            if (!infoBase.telefono || typeof infoBase.telefono !== 'string' || infoBase.telefono.trim() === '') {
                return 'El teléfono es requerido y debe ser una cadena válida';
            }
        }

        if (infoBase.nombre !== undefined) {
            if (typeof infoBase.nombre !== 'string' || infoBase.nombre.trim() === '') {
                return 'El nombre debe ser una cadena válida';
            }
            if (infoBase.nombre.trim().length < 2 || infoBase.nombre.trim().length > 100) {
                return 'El nombre debe tener entre 2 y 100 caracteres';
            }
        }

        if (infoBase.telefono !== undefined) {
            if (typeof infoBase.telefono !== 'string' || infoBase.telefono.trim() === '') {
                return 'El teléfono debe ser una cadena válida';
            }
            if (!/^[\d\s\-\+\(\)]+$/.test(infoBase.telefono)) {
                return 'El teléfono contiene caracteres inválidos';
            }
        }

        if (infoBase.email !== undefined && infoBase.email !== null) {
            if (typeof infoBase.email !== 'string') {
                return 'El email debe ser una cadena';
            }
            if (infoBase.email.trim() !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(infoBase.email)) {
                return 'El email no tiene un formato válido';
            }
        }

        if (infoBase.descripcion !== undefined && infoBase.descripcion !== null) {
            if (typeof infoBase.descripcion !== 'string') {
                return 'La descripción debe ser una cadena';
            }
            if (infoBase.descripcion.length > 500) {
                return 'La descripción no puede exceder los 500 caracteres';
            }
        }

        if (infoBase.tiposResiduos !== undefined && infoBase.tiposResiduos !== null) {
            if (!Array.isArray(infoBase.tiposResiduos)) {
                return 'Los tipos de residuos deben ser un array';
            }
            if (infoBase.tiposResiduos.some((tipo: any) => typeof tipo !== 'string')) {
                return 'Todos los tipos de residuos deben ser cadenas';
            }
        }

        return null;
    }

    /**
     * Obtener citas de un reciclador
     * GET /recyclers/:id/appointments
     */
    static async getRecyclerAppointments(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            // Validar ID
            if (!id || id.trim() === '') {
                res.status(400).json({ 
                    success: false,
                    error: 'ID de reciclador inválido' 
                });
                return;
            }

            // Verificar que el reciclador existe
            const recycler = await RecyclerService.getRecyclerById(id);
            if (!recycler) {
                res.status(404).json({ 
                    success: false,
                    error: 'Reciclador no encontrado' 
                });
                return;
            }

            const appointments = await RecyclerService.getRecyclerAppointments(id);

            res.status(200).json({
                success: true,
                data: appointments,
                count: appointments.length,
                message: `Citas encontradas para el reciclador ${recycler.infoBase.nombre}`
            });
        } catch (error) {
            console.error('Error in getRecyclerAppointments:', error);
            res.status(500).json({ 
                success: false,
                error: 'Error interno del servidor',
                message: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    /**
     * Obtener reseñas de un reciclador
     * GET /recyclers/:id/reviews
     */
    static async getRecyclerReviews(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            // Validar ID
            if (!id || id.trim() === '') {
                res.status(400).json({ 
                    success: false,
                    error: 'ID de reciclador inválido' 
                });
                return;
            }

            // Verificar que el reciclador existe
            const recycler = await RecyclerService.getRecyclerById(id);
            if (!recycler) {
                res.status(404).json({ 
                    success: false,
                    error: 'Reciclador no encontrado' 
                });
                return;
            }

            const reviews = await RecyclerService.getRecyclerReviews(id);

            res.status(200).json({
                success: true,
                data: reviews,
                count: reviews.length,
                message: `Reseñas encontradas para el reciclador ${recycler.infoBase.nombre}`
            });
        } catch (error) {
            console.error('Error in getRecyclerReviews:', error);
            res.status(500).json({ 
                success: false,
                error: 'Error interno del servidor',
                message: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    /**
     * Obtener rutas de transporte de un reciclador
     * GET /recyclers/:id/transport-routes
     */
    static async getRecyclerTransportRoutes(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            // Validar ID
            if (!id || id.trim() === '') {
                res.status(400).json({ 
                    success: false,
                    error: 'ID de reciclador inválido' 
                });
                return;
            }

            // Verificar que el reciclador existe
            const recycler = await RecyclerService.getRecyclerById(id);
            if (!recycler) {
                res.status(404).json({ 
                    success: false,
                    error: 'Reciclador no encontrado' 
                });
                return;
            }

            const routes = await RecyclerService.getRecyclerTransportRoutes(id);

            res.status(200).json({
                success: true,
                data: routes,
                count: routes.length,
                message: `Rutas de transporte encontradas para el reciclador ${recycler.infoBase.nombre}`
            });
        } catch (error) {
            console.error('Error in getRecyclerTransportRoutes:', error);
            res.status(500).json({ 
                success: false,
                error: 'Error interno del servidor',
                message: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }
}
