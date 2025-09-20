import { Router } from 'express';
import {
    createAppointmentHandler,
    getAppointmentsHandler,
    getAppointmentByIdHandler,
    updateAppointmentHandler,
    deleteAppointmentHandler,
    getAppointmentsByStatusHandler,
    approveOrRejectAppointmentHandler
} from '../controllers/appointment.controller';

const router = Router();

// Obtener todas las citas
router.get('/', getAppointmentsHandler);

// Obtener citas por estado
router.get('/status/:estado', getAppointmentsByStatusHandler);

// Obtener una cita por ID
router.get('/:id', getAppointmentByIdHandler);

// Crear una nueva cita
router.post('/', createAppointmentHandler);

// Actualizar una cita existente
router.put('/:id', updateAppointmentHandler);

// Aprobar o rechazar una cita
router.put('/:id/approve-reject', approveOrRejectAppointmentHandler);

// Eliminar una cita
router.delete('/:id', deleteAppointmentHandler);

export default router;
