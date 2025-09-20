// src/routes/transport.route.ts
import { Router } from 'express';
import { TransportController } from '../controllers/transport.controller';

const router = Router();

/**
 * @route GET /transport/recycler/:id
 * @desc Obtener la ruta asignada a un reciclador
 * @access Public
 * @param {string} id - ID del reciclador
 */
router.get('/transport/recycler/:id', TransportController.getTransportByRecyclerId);

/**
 * @route POST /transport/recycler/:id
 * @desc Asignar/crear una ruta para un reciclador
 * @access Public
 * @param {string} id - ID del reciclador
 * @body {IPuntoRuta[]} puntos - Array de puntos de la ruta
 */
router.post('/transport/recycler/:id', TransportController.createOrUpdateTransportRoute);

/**
 * @route GET /transport/routes
 * @desc Obtener todas las rutas activas
 * @access Public
 */
router.get('/transport/routes', TransportController.getAllActiveRoutes);

/**
 * @route GET /transport/routes/:id/stats
 * @desc Obtener estadísticas de una ruta específica
 * @access Public
 * @param {string} id - ID de la ruta de transporte
 */
router.get('/transport/routes/:id/stats', TransportController.getRouteStats);

/**
 * @route POST /transport/routes/:id/optimize
 * @desc Optimizar una ruta existente usando algoritmo del vecino más cercano
 * @access Public
 * @param {string} id - ID de la ruta de transporte
 * @body {IPuntoRuta} puntoInicio - Punto de inicio para la optimización (opcional)
 */
router.post('/transport/routes/:id/optimize', TransportController.optimizeRoute);

/**
 * @route PUT /transport/routes/:id
 * @desc Actualizar una ruta existente
 * @access Public
 * @param {string} id - ID de la ruta de transporte
 * @body {IPuntoRuta[]} puntos - Array de puntos actualizados
 */
router.put('/transport/routes/:id', TransportController.updateTransportRoute);

/**
 * @route DELETE /transport/routes/:id
 * @desc Desactivar una ruta de transporte
 * @access Public
 * @param {string} id - ID de la ruta de transporte
 */
router.delete('/transport/routes/:id', TransportController.deactivateRoute);

export default router;
