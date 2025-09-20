// src/routes/review.route.ts
import { Router } from 'express';
import { ReviewController } from '../controllers/review.controller';

const router = Router();

/**
 * @route POST /recyclers/:id/reviews
 * @desc Crear una nueva reseña para un reciclador
 * @access Public
 * @param {string} id - ID del reciclador
 * @body {ICreateReviewRequest} - Datos de la reseña
 */
router.post('/recyclers/:id/reviews', ReviewController.createReview);

/**
 * @route GET /recyclers/:id/reviews
 * @desc Obtener reseñas de un reciclador con paginación
 * @access Public
 * @param {string} id - ID del reciclador
 * @query {number} limit - Número máximo de reseñas a retornar (1-50, default: 10)
 * @query {string} startAfter - ID del documento después del cual comenzar (para paginación)
 */
router.get('/recyclers/:id/reviews', ReviewController.getReviewsByRecyclerId);

/**
 * @route GET /recyclers/:id/reviews/stats
 * @desc Obtener estadísticas de rating de un reciclador
 * @access Public
 * @param {string} id - ID del reciclador
 */
router.get('/recyclers/:id/reviews/stats', ReviewController.getRecyclerStats);

export default router;
