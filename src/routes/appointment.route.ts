import { Router } from 'express';
import {
    createAppointmentHandler,
    getAppointmentsHandler,
    getAppointmentByIdHandler,
    updateAppointmentHandler,
    deleteAppointmentHandler
} from '../controllers/appointment.controller';

const router = Router();

// Obtener todas las citas
router.get('/', getAppointmentsHandler);

// Obtener una cita por ID
router.get('/:id', getAppointmentByIdHandler);

// Crear una nueva cita
router.post('/', createAppointmentHandler);

// Actualizar una cita existente
router.put('/:id', updateAppointmentHandler);

// Eliminar una cita
router.delete('/:id', deleteAppointmentHandler);

export default router;
