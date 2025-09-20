// src/routes/appointment.route.ts
import { Router } from 'express';
import { AppointmentController } from '../controllers/appointment.controller';

const router = Router();

/**
 * @route POST /appointments/:id/complete
 * @desc Completar una cita con evidencias y calcular créditos
 * @access Public
 * @param {string} id - ID de la cita
 * @body {ICompleteAppointmentRequest} - Datos de finalización de la cita
 */
router.post('/appointments/:id/complete', AppointmentController.completeAppointment);

/**
 * @route GET /appointments/:id/completion
 * @desc Obtener detalles de finalización de una cita
 * @access Public
 * @param {string} id - ID de la cita
 */
router.get('/appointments/:id/completion', AppointmentController.getAppointmentCompletion);

/**
 * @route GET /appointments/:id/completion/stats
 * @desc Obtener estadísticas detalladas de finalización de una cita
 * @access Public
 * @param {string} id - ID de la cita
 */
router.get('/appointments/:id/completion/stats', AppointmentController.getCompletionStats);

/**
 * @route GET /appointments/:id/can-complete
 * @desc Verificar si una cita puede ser completada
 * @access Public
 * @param {string} id - ID de la cita
 */
router.get('/appointments/:id/can-complete', AppointmentController.canCompleteAppointment);

export default router;
