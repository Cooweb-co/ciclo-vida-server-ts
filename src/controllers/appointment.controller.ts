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
        const appointmentData = req.body;
        
        // Validar el campo materials
        const validationError = validateAppointmentData(appointmentData);
        if (validationError) {
            res.status(400).json({ 
                success: false,
                error: 'Datos de entrada inválidos',
                message: validationError 
            });
            return;
        }

        const appointment = appointmentData as Omit<Appointment, 'id'>;
        const newAppointment = await createAppointment(appointment);
        res.status(201).json({ 
            success: true,
            data: { id: newAppointment.id },
            message: 'Cita creada exitosamente'
        });
    } catch (error) {
        if (error instanceof Error) {
            res.status(400).json({ 
                success: false,
                error: error.message 
            });
        } else {
            res.status(500).json({ 
                success: false,
                error: 'Error interno del servidor' 
            });
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
        const appointmentData = req.body as Partial<Appointment>;
        
        // Si se está actualizando materials, validar que sea un array válido
        if (appointmentData.materials !== undefined) {
            if (!Array.isArray(appointmentData.materials)) {
                res.status(400).json({ 
                    success: false,
                    error: 'Los materiales deben ser un array' 
                });
                return;
            }
            
            if (appointmentData.materials.length === 0) {
                res.status(400).json({ 
                    success: false,
                    error: 'Debe especificar al menos un tipo de material' 
                });
                return;
            }
            
            // Validar cada material
            for (let i = 0; i < appointmentData.materials.length; i++) {
                const material = appointmentData.materials[i];
                if (typeof material !== 'string' || material.trim().length === 0) {
                    res.status(400).json({ 
                        success: false,
                        error: `El material ${i + 1} debe ser una cadena de texto no vacía` 
                    });
                    return;
                }
            }
        }
        
        await updateAppointment(id, appointmentData);
        res.status(200).json({ 
            success: true,
            message: 'Cita actualizada exitosamente' 
        });
    } catch (error) {
        if (error instanceof Error) {
            res.status(400).json({ 
                success: false,
                error: error.message 
            });
        } else {
            res.status(500).json({ 
                success: false,
                error: 'Error interno del servidor' 
            });
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

/**
 * Validar datos para crear una cita
 */
const validateAppointmentData = (data: any): string | null => {
    if (!data) {
        return 'Los datos de la cita son requeridos';
    }

    // Validar clienteId
    if (!data.clienteId || typeof data.clienteId !== 'string') {
        return 'El ID del cliente es requerido';
    }

    // Validar recicladorId
    if (!data.recicladorId || typeof data.recicladorId !== 'string') {
        return 'El ID del reciclador es requerido';
    }

    // Validar fecha
    if (!data.fecha) {
        return 'La fecha es requerida';
    }

    // Validar direccion
    if (!data.direccion || typeof data.direccion !== 'string') {
        return 'La dirección es requerida';
    }

    if (data.direccion.trim().length === 0) {
        return 'La dirección no puede estar vacía';
    }

    // Validar cantidadAproxMaterial
    if (typeof data.cantidadAproxMaterial !== 'number' || isNaN(data.cantidadAproxMaterial)) {
        return 'La cantidad aproximada de material debe ser un número válido';
    }

    if (data.cantidadAproxMaterial <= 0) {
        return 'La cantidad aproximada de material debe ser mayor a 0';
    }

    // Validar descripcion
    if (!data.descripcion || typeof data.descripcion !== 'string') {
        return 'La descripción es requerida';
    }

    if (data.descripcion.trim().length === 0) {
        return 'La descripción no puede estar vacía';
    }

    // Validar materials (nuevo campo)
    if (!data.materials || !Array.isArray(data.materials)) {
        return 'Los materiales son requeridos y deben ser un array';
    }

    if (data.materials.length === 0) {
        return 'Debe especificar al menos un tipo de material';
    }

    // Validar cada material en el array
    for (let i = 0; i < data.materials.length; i++) {
        const material = data.materials[i];
        if (typeof material !== 'string') {
            return `El material ${i + 1} debe ser una cadena de texto`;
        }

        if (material.trim().length === 0) {
            return `El material ${i + 1} no puede estar vacío`;
        }
    }

    return null;
};
