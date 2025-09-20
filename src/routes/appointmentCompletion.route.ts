// src/routes/appointmentCompletion.route.ts
import { Router } from 'express';
import { AppointmentCompletionController } from '../controllers/appointmentCompletion.controller';

const router = Router();

/**
 * @route POST /appointments/:id/complete
 * @desc Completar una cita con evidencias y calcular créditos
 * @access Public
 * @param {string} id - ID de la cita
 * @body {ICompleteAppointmentRequest} - Datos de finalización de la cita
 */
router.post('/appointments/:id/complete', AppointmentCompletionController.completeAppointment);

export default router;
