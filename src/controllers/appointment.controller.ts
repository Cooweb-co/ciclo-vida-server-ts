import { Request, Response } from 'express';
import {
    createAppointment,
    getAppointments,
    getAppointmentById,
    updateAppointment,
    deleteAppointment,
    getAppointmentsByStatus,
    approveOrRejectAppointment
} from '../models/Appointment';
import { Appointment, EstadoAppointment, ApproveRejectRequest } from '../types/appointment.types';

export const createAppointmentHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const appointment = req.body as Omit<Appointment, 'id'>;
        const newAppointment = await createAppointment(appointment);
        res.status(201).json({ id: newAppointment.id });
    } catch (error) {
        if (error instanceof Error) {
            res.status(400).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'An unexpected error occurred' });
        }
    }
};

export const getAppointmentsHandler = async (_req: Request, res: Response): Promise<void> => {
    try {
        const appointments = await getAppointments();
        res.status(200).json(appointments);
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve appointments' });
    }
};

export const getAppointmentByIdHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const appointment = await getAppointmentById(id);
        if (appointment) {
            res.status(200).json(appointment);
        } else {
            res.status(404).json({ message: 'Appointment not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve appointment' });
    }
};

export const updateAppointmentHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const appointment = req.body as Partial<Appointment>;
        await updateAppointment(id, appointment);
        res.status(200).json({ message: 'Appointment updated successfully' });
    } catch (error) {
        if (error instanceof Error) {
            res.status(400).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Failed to update appointment' });
        }
    }
};

export const deleteAppointmentHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        await deleteAppointment(id);
        res.status(200).json({ message: 'Appointment deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete appointment' });
    }
};

/**
 * Obtener citas por estado
 * GET /appointments/status/:estado
 */
export const getAppointmentsByStatusHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const { estado } = req.params;
        
        // Validar que el estado es válido
        const validStates: EstadoAppointment[] = ['pendiente', 'aprobada', 'rechazada', 'completada', 'cancelada'];
        if (!validStates.includes(estado as EstadoAppointment)) {
            res.status(400).json({ 
                success: false,
                error: 'Estado inválido',
                message: `El estado debe ser uno de: ${validStates.join(', ')}` 
            });
            return;
        }

        const appointments = await getAppointmentsByStatus(estado as EstadoAppointment);
        
        res.status(200).json({
            success: true,
            data: appointments,
            count: appointments.length,
            estado: estado
        });
    } catch (error) {
        console.error('Error in getAppointmentsByStatusHandler:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error interno del servidor',
            message: 'No se pudieron obtener las citas'
        });
    }
};

/**
 * Aprobar o rechazar una cita
 * PUT /appointments/:id/approve-reject
 */
export const approveOrRejectAppointmentHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const approveRejectData = req.body as ApproveRejectRequest;

        // Validar ID de la cita
        if (!id || id.trim() === '') {
            res.status(400).json({ 
                success: false,
                error: 'ID de cita inválido' 
            });
            return;
        }

        // Validar datos de entrada
        const validationError = validateApproveRejectData(approveRejectData);
        if (validationError) {
            res.status(400).json({ 
                success: false,
                error: 'Datos de entrada inválidos', 
                message: validationError 
            });
            return;
        }

        // Aprobar o rechazar la cita
        const updatedAppointment = await approveOrRejectAppointment(id, approveRejectData);

        res.status(200).json({
            success: true,
            message: `Cita ${approveRejectData.estado} exitosamente`,
            data: updatedAppointment
        });
    } catch (error) {
        console.error('Error in approveOrRejectAppointmentHandler:', error);
        
        if (error instanceof Error) {
            if (error.message.includes('no encontrada')) {
                res.status(404).json({ 
                    success: false,
                    error: 'Cita no encontrada',
                    message: error.message
                });
                return;
            }

            if (error.message.includes('No se puede cambiar el estado') || 
                error.message.includes('motivo de rechazo es requerido')) {
                res.status(400).json({ 
                    success: false,
                    error: 'Operación no válida',
                    message: error.message
                });
                return;
            }
        }

        res.status(500).json({ 
            success: false,
            error: 'Error interno del servidor',
            message: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
};

/**
 * Validar datos para aprobar/rechazar una cita
 */
const validateApproveRejectData = (data: any): string | null => {
    if (!data) {
        return 'Los datos son requeridos';
    }

    // Validar estado
    if (!data.estado) {
        return 'El estado es requerido';
    }

    if (data.estado !== 'aprobada' && data.estado !== 'rechazada') {
        return 'El estado debe ser "aprobada" o "rechazada"';
    }

    // Validar motivo de rechazo si es necesario
    if (data.estado === 'rechazada') {
        if (!data.motivoRechazo || typeof data.motivoRechazo !== 'string') {
            return 'El motivo de rechazo es requerido cuando se rechaza una cita';
        }

        if (data.motivoRechazo.trim().length < 5) {
            return 'El motivo de rechazo debe tener al menos 5 caracteres';
        }

        if (data.motivoRechazo.length > 500) {
            return 'El motivo de rechazo no puede exceder 500 caracteres';
        }
    }

    return null;
};
