// src/controllers/transport.controller.ts
import { Request, Response } from 'express';
import { TransportService } from '../models/TransportService';
import { 
    ICreateTransportRequest, 
    IUpdateTransportRequest,
    IPuntoRuta
} from '../types/transport.types';

export class TransportController {
    /**
     * Obtener la ruta asignada a un reciclador
     * GET /transport/recycler/:id
     */
    static async getTransportByRecyclerId(req: Request, res: Response): Promise<void> {
        try {
            const { id: recicladorId } = req.params;

            // Validar ID del reciclador
            if (!recicladorId || recicladorId.trim() === '') {
                res.status(400).json({ 
                    success: false,
                    error: 'ID de reciclador inválido' 
                });
                return;
            }

            const transport = await TransportService.getTransportByRecyclerId(recicladorId);

            if (!transport) {
                res.status(404).json({ 
                    success: false,
                    error: 'No se encontró una ruta asignada para este reciclador',
                    message: 'El reciclador no tiene una ruta activa asignada'
                });
                return;
            }

            // Obtener estadísticas adicionales de la ruta
            const stats = await TransportService.getRouteStats(transport.id);

            res.status(200).json({
                success: true,
                data: {
                    ...transport,
                    stats: {
                        totalPuntos: stats.totalPuntos,
                        distanciaTotal: stats.distanciaTotal,
                        tiempoEstimado: stats.tiempoEstimado
                    }
                }
            });
        } catch (error) {
            console.error('Error in getTransportByRecyclerId:', error);
            res.status(500).json({ 
                success: false,
                error: 'Error interno del servidor',
                message: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    /**
     * Asignar/crear una ruta para un reciclador
     * POST /transport/recycler/:id
     */
    static async createOrUpdateTransportRoute(req: Request, res: Response): Promise<void> {
        try {
            const { id: recicladorId } = req.params;
            const { puntos }: { puntos: IPuntoRuta[] } = req.body;

            // Validar ID del reciclador
            if (!recicladorId || recicladorId.trim() === '') {
                res.status(400).json({ 
                    success: false,
                    error: 'ID de reciclador inválido' 
                });
                return;
            }

            // Validar datos de entrada
            const validationError = TransportController.validateTransportData({ puntos });
            if (validationError) {
                res.status(400).json({ 
                    success: false,
                    error: 'Datos de entrada inválidos', 
                    details: validationError 
                });
                return;
            }

            const transportData: ICreateTransportRequest = {
                recicladorId,
                puntos
            };

            // Crear o actualizar la ruta
            const transport = await TransportService.createTransportRoute(transportData);

            res.status(201).json({
                success: true,
                message: 'Ruta asignada exitosamente',
                data: transport
            });
        } catch (error) {
            console.error('Error in createOrUpdateTransportRoute:', error);
            res.status(500).json({ 
                success: false,
                error: 'Error interno del servidor',
                message: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    /**
     * Obtener todas las rutas activas
     * GET /transport/routes
     */
    static async getAllActiveRoutes(req: Request, res: Response): Promise<void> {
        try {
            const routes = await TransportService.getAllActiveRoutes();

            res.status(200).json({
                success: true,
                data: routes,
                count: routes.length
            });
        } catch (error) {
            console.error('Error in getAllActiveRoutes:', error);
            res.status(500).json({ 
                success: false,
                error: 'Error interno del servidor',
                message: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    /**
     * Obtener estadísticas de una ruta específica
     * GET /transport/routes/:id/stats
     */
    static async getRouteStats(req: Request, res: Response): Promise<void> {
        try {
            const { id: transportId } = req.params;

            // Validar ID de la ruta
            if (!transportId || transportId.trim() === '') {
                res.status(400).json({ 
                    success: false,
                    error: 'ID de ruta inválido' 
                });
                return;
            }

            const stats = await TransportService.getRouteStats(transportId);

            res.status(200).json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('Error in getRouteStats:', error);
            
            if (error instanceof Error && error.message.includes('no encontrada')) {
                res.status(404).json({ 
                    success: false,
                    error: 'Ruta no encontrada',
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
     * Optimizar una ruta existente
     * POST /transport/routes/:id/optimize
     */
    static async optimizeRoute(req: Request, res: Response): Promise<void> {
        try {
            const { id: transportId } = req.params;
            const { puntoInicio }: { puntoInicio?: IPuntoRuta } = req.body;

            // Validar ID de la ruta
            if (!transportId || transportId.trim() === '') {
                res.status(400).json({ 
                    success: false,
                    error: 'ID de ruta inválido' 
                });
                return;
            }

            // Validar punto de inicio si se proporciona
            if (puntoInicio) {
                const puntoError = TransportController.validatePunto(puntoInicio, 0);
                if (puntoError) {
                    res.status(400).json({ 
                        success: false,
                        error: 'Punto de inicio inválido',
                        details: puntoError
                    });
                    return;
                }
            }

            const optimizedRoute = await TransportService.optimizeRoute(transportId, puntoInicio);

            res.status(200).json({
                success: true,
                message: 'Ruta optimizada exitosamente',
                data: optimizedRoute
            });
        } catch (error) {
            console.error('Error in optimizeRoute:', error);
            
            if (error instanceof Error && error.message.includes('no encontrada')) {
                res.status(404).json({ 
                    success: false,
                    error: 'Ruta no encontrada',
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
     * Desactivar una ruta de transporte
     * DELETE /transport/routes/:id
     */
    static async deactivateRoute(req: Request, res: Response): Promise<void> {
        try {
            const { id: transportId } = req.params;

            // Validar ID de la ruta
            if (!transportId || transportId.trim() === '') {
                res.status(400).json({ 
                    success: false,
                    error: 'ID de ruta inválido' 
                });
                return;
            }

            const deactivated = await TransportService.deactivateTransportRoute(transportId);

            if (!deactivated) {
                res.status(404).json({ 
                    success: false,
                    error: 'Ruta no encontrada' 
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'Ruta desactivada exitosamente'
            });
        } catch (error) {
            console.error('Error in deactivateRoute:', error);
            res.status(500).json({ 
                success: false,
                error: 'Error interno del servidor',
                message: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    /**
     * Actualizar una ruta existente
     * PUT /transport/routes/:id
     */
    static async updateTransportRoute(req: Request, res: Response): Promise<void> {
        try {
            const { id: transportId } = req.params;
            const { puntos }: { puntos: IPuntoRuta[] } = req.body;

            // Validar ID de la ruta
            if (!transportId || transportId.trim() === '') {
                res.status(400).json({ 
                    success: false,
                    error: 'ID de ruta inválido' 
                });
                return;
            }

            // Validar datos de entrada
            const validationError = TransportController.validateTransportData({ puntos });
            if (validationError) {
                res.status(400).json({ 
                    success: false,
                    error: 'Datos de entrada inválidos', 
                    details: validationError 
                });
                return;
            }

            const updateData: IUpdateTransportRequest = { puntos };
            const updatedTransport = await TransportService.updateTransportRoute(transportId, updateData);

            res.status(200).json({
                success: true,
                message: 'Ruta actualizada exitosamente',
                data: updatedTransport
            });
        } catch (error) {
            console.error('Error in updateTransportRoute:', error);
            
            if (error instanceof Error && error.message.includes('no encontrada')) {
                res.status(404).json({ 
                    success: false,
                    error: 'Ruta no encontrada',
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
     * Validar datos para crear/actualizar una ruta de transporte
     */
    private static validateTransportData(data: { puntos: IPuntoRuta[] }): string | null {
        if (!data || !data.puntos) {
            return 'Los puntos de la ruta son requeridos';
        }

        if (!Array.isArray(data.puntos)) {
            return 'Los puntos deben ser un array';
        }

        if (data.puntos.length === 0) {
            return 'Debe proporcionar al menos un punto en la ruta';
        }

        if (data.puntos.length > 50) {
            return 'La ruta no puede tener más de 50 puntos';
        }

        // Validar cada punto
        for (let i = 0; i < data.puntos.length; i++) {
            const punto = data.puntos[i];
            const puntoError = this.validatePunto(punto, i);
            if (puntoError) return puntoError;
        }

        // Validar que no haya órdenes duplicados
        const ordenes = data.puntos.map(p => p.orden);
        const ordenesUnicos = new Set(ordenes);
        if (ordenes.length !== ordenesUnicos.size) {
            return 'No puede haber puntos con el mismo número de orden';
        }

        return null;
    }

    /**
     * Validar un punto individual de la ruta
     */
    private static validatePunto(punto: any, index: number): string | null {
        if (!punto || typeof punto !== 'object') {
            return `El punto ${index + 1} debe ser un objeto válido`;
        }

        if (typeof punto.lat !== 'number' || isNaN(punto.lat)) {
            return `La latitud del punto ${index + 1} debe ser un número válido`;
        }

        if (punto.lat < -90 || punto.lat > 90) {
            return `La latitud del punto ${index + 1} debe estar entre -90 y 90`;
        }

        if (typeof punto.lng !== 'number' || isNaN(punto.lng)) {
            return `La longitud del punto ${index + 1} debe ser un número válido`;
        }

        if (punto.lng < -180 || punto.lng > 180) {
            return `La longitud del punto ${index + 1} debe estar entre -180 y 180`;
        }

        if (typeof punto.orden !== 'number' || isNaN(punto.orden)) {
            return `El orden del punto ${index + 1} debe ser un número válido`;
        }

        if (punto.orden < 1) {
            return `El orden del punto ${index + 1} debe ser mayor a 0`;
        }

        if (!Number.isInteger(punto.orden)) {
            return `El orden del punto ${index + 1} debe ser un número entero`;
        }

        return null;
    }
}
