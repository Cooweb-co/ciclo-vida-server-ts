// src/controllers/review.controller.ts
import { Request, Response } from 'express';
import { ReviewService } from '../models/ReviewService';
import { ICreateReviewRequest, IPaginationQuery } from '../types/review.types';

export class ReviewController {
    /**
     * Crear una nueva reseña para un reciclador
     * POST /recyclers/:id/reviews
     */
    static async createReview(req: Request, res: Response): Promise<void> {
        try {
            const { id: recicladorId } = req.params;
            const reviewData: ICreateReviewRequest = req.body;

            // Validaciones
            const validationError = ReviewController.validateCreateReviewData(reviewData);
            if (validationError) {
                res.status(400).json({ 
                    error: 'Datos de entrada inválidos', 
                    details: validationError 
                });
                return;
            }

            // Validar que el recicladorId sea válido
            if (!recicladorId || recicladorId.trim() === '') {
                res.status(400).json({ 
                    error: 'ID de reciclador inválido' 
                });
                return;
            }

            // Crear la reseña
            const newReview = await ReviewService.createReview(recicladorId, reviewData);

            res.status(201).json({
                success: true,
                message: 'Reseña creada exitosamente',
                data: newReview
            });
        } catch (error) {
            console.error('Error in createReview:', error);
            res.status(500).json({ 
                error: 'Error interno del servidor',
                message: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    /**
     * Obtener reseñas de un reciclador con paginación
     * GET /recyclers/:id/reviews
     */
    static async getReviewsByRecyclerId(req: Request, res: Response): Promise<void> {
        try {
            const { id: recicladorId } = req.params;
            const { limit, startAfter }: IPaginationQuery = req.query;

            // Validar recicladorId
            if (!recicladorId || recicladorId.trim() === '') {
                res.status(400).json({ 
                    error: 'ID de reciclador inválido' 
                });
                return;
            }

            // Validar y parsear limit
            let limitNumber = 10; // Valor por defecto
            if (limit) {
                const parsedLimit = parseInt(limit.toString(), 10);
                if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 50) {
                    res.status(400).json({ 
                        error: 'El parámetro limit debe ser un número entre 1 y 50' 
                    });
                    return;
                }
                limitNumber = parsedLimit;
            }

            // Obtener reseñas
            const result = await ReviewService.getReviewsByRecyclerId(
                recicladorId, 
                limitNumber, 
                startAfter?.toString()
            );

            // Obtener estadísticas adicionales
            const stats = await ReviewService.getAverageRating(recicladorId);

            res.status(200).json({
                success: true,
                data: {
                    ...result,
                    stats: {
                        averageRating: stats.average,
                        totalReviews: stats.count
                    }
                }
            });
        } catch (error) {
            console.error('Error in getReviewsByRecyclerId:', error);
            res.status(500).json({ 
                error: 'Error interno del servidor',
                message: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    /**
     * Obtener estadísticas de rating de un reciclador
     * GET /recyclers/:id/reviews/stats
     */
    static async getRecyclerStats(req: Request, res: Response): Promise<void> {
        try {
            const { id: recicladorId } = req.params;

            // Validar recicladorId
            if (!recicladorId || recicladorId.trim() === '') {
                res.status(400).json({ 
                    error: 'ID de reciclador inválido' 
                });
                return;
            }

            const stats = await ReviewService.getAverageRating(recicladorId);

            res.status(200).json({
                success: true,
                data: {
                    recicladorId,
                    averageRating: stats.average,
                    totalReviews: stats.count
                }
            });
        } catch (error) {
            console.error('Error in getRecyclerStats:', error);
            res.status(500).json({ 
                error: 'Error interno del servidor',
                message: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    /**
     * Validar datos para crear una reseña
     */
    private static validateCreateReviewData(data: any): string | null {
        if (!data) {
            return 'Los datos de la reseña son requeridos';
        }

        if (!data.usuarioId || typeof data.usuarioId !== 'string' || data.usuarioId.trim() === '') {
            return 'El ID del usuario es requerido y debe ser una cadena válida';
        }

        if (!data.rating || typeof data.rating !== 'number') {
            return 'El rating es requerido y debe ser un número';
        }

        if (data.rating < 1 || data.rating > 5 || !Number.isInteger(data.rating)) {
            return 'El rating debe ser un número entero entre 1 y 5';
        }

        if (!data.comentario || typeof data.comentario !== 'string') {
            return 'El comentario es requerido y debe ser una cadena';
        }

        if (data.comentario.trim().length < 5) {
            return 'El comentario debe tener al menos 5 caracteres';
        }

        if (data.comentario.trim().length > 500) {
            return 'El comentario no puede exceder los 500 caracteres';
        }

        return null;
    }
}
