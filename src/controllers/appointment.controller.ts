import { Request, Response } from 'express';
import {
    createAppointment,
    getAppointments,
    getAppointmentById,
    updateAppointment,
    deleteAppointment
} from '../models/Appointment';
import { Appointment } from '../types/appointment.types';

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
