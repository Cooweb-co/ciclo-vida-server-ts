// src/controllers/appointment.controller.ts
import { Request, Response } from 'express';
import { AppointmentCompletionService } from '../models/AppointmentCompletionService';
import { 
    ICompleteAppointmentRequest,
    IDetalleMaterial,
    TipoMaterial
} from '../types/appointment.types';

export class AppointmentController {
    /**
     * Completar una cita con evidencias
     * POST /appointments/:id/complete
     */
    static async completeAppointment(req: Request, res: Response): Promise<void> {
        try {
            const { id: appointmentId } = req.params;
            const completionData: ICompleteAppointmentRequest = req.body;

            // Validar ID de la cita
            if (!appointmentId || appointmentId.trim() === '') {
                res.status(400).json({ 
                    success: false,
                    error: 'ID de cita inválido' 
                });
                return;
            }

            // Validar datos de entrada
            const validationError = AppointmentController.validateCompletionData(completionData);
            if (validationError) {
                res.status(400).json({ 
                    success: false,
                    error: 'Datos de entrada inválidos', 
                    details: validationError 
                });
                return;
            }

            // Verificar si la cita puede ser completada
            const canComplete = await AppointmentCompletionService.canCompleteAppointment(appointmentId);
            if (!canComplete.canComplete) {
                res.status(400).json({ 
                    success: false,
                    error: 'No se puede completar la cita',
                    reason: canComplete.reason
                });
                return;
            }

            // Completar la cita
            const result = await AppointmentCompletionService.completeAppointment(
                appointmentId, 
                completionData
            );

            res.status(200).json({
                success: true,
                message: 'Cita completada exitosamente',
                data: {
                    appointmentCompletion: result.appointmentCompletion,
                    creditosGenerados: result.creditosGenerados,
                    creditosTotal: result.creditosTotal
                }
            });
        } catch (error) {
            console.error('Error in completeAppointment:', error);
            
            if (error instanceof Error) {
                if (error.message.includes('no encontrada')) {
                    res.status(404).json({ 
                        success: false,
                        error: 'Cita no encontrada',
                        message: error.message
                    });
                    return;
                }

                if (error.message.includes('ya está completada') || 
                    error.message.includes('cancelada')) {
                    res.status(409).json({ 
                        success: false,
                        error: 'Estado de cita inválido',
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
    }

    /**
     * Obtener detalles de finalización de una cita
     * GET /appointments/:id/completion
     */
    static async getAppointmentCompletion(req: Request, res: Response): Promise<void> {
        try {
            const { id: appointmentId } = req.params;

            // Validar ID de la cita
            if (!appointmentId || appointmentId.trim() === '') {
                res.status(400).json({ 
                    success: false,
                    error: 'ID de cita inválido' 
                });
                return;
            }

            const completion = await AppointmentCompletionService.getAppointmentCompletion(appointmentId);

            if (!completion) {
                res.status(404).json({ 
                    success: false,
                    error: 'Finalización de cita no encontrada' 
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: completion
            });
        } catch (error) {
            console.error('Error in getAppointmentCompletion:', error);
            res.status(500).json({ 
                success: false,
                error: 'Error interno del servidor',
                message: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    /**
     * Obtener estadísticas de finalización de una cita
     * GET /appointments/:id/completion/stats
     */
    static async getCompletionStats(req: Request, res: Response): Promise<void> {
        try {
            const { id: appointmentId } = req.params;

            // Validar ID de la cita
            if (!appointmentId || appointmentId.trim() === '') {
                res.status(400).json({ 
                    success: false,
                    error: 'ID de cita inválido' 
                });
                return;
            }

            const stats = await AppointmentCompletionService.getCompletionStats(appointmentId);

            res.status(200).json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('Error in getCompletionStats:', error);
            
            if (error instanceof Error && error.message.includes('no encontrada')) {
                res.status(404).json({ 
                    success: false,
                    error: 'Finalización de cita no encontrada',
                    message: error.message
                });
                return;
            }

            res.status(500).json({ 
                success: false,
                error: 'Error interno del servidor',
                message: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    /**
     * Verificar si una cita puede ser completada
     * GET /appointments/:id/can-complete
     */
    static async canCompleteAppointment(req: Request, res: Response): Promise<void> {
        try {
            const { id: appointmentId } = req.params;

            // Validar ID de la cita
            if (!appointmentId || appointmentId.trim() === '') {
                res.status(400).json({ 
                    success: false,
                    error: 'ID de cita inválido' 
                });
                return;
            }

            const result = await AppointmentCompletionService.canCompleteAppointment(appointmentId);

            res.status(200).json({
                success: true,
                data: {
                    canComplete: result.canComplete,
                    reason: result.reason,
                    appointment: result.appointment
                }
            });
        } catch (error) {
            console.error('Error in canCompleteAppointment:', error);
            res.status(500).json({ 
                success: false,
                error: 'Error interno del servidor',
                message: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    /**
     * Validar datos para completar una cita
     */
    private static validateCompletionData(data: any): string | null {
        if (!data) {
            return 'Los datos de finalización son requeridos';
        }

        // Validar fotos
        if (!data.fotos || !Array.isArray(data.fotos)) {
            return 'Las fotos son requeridas y deben ser un array';
        }

        if (data.fotos.length === 0) {
            return 'Debe proporcionar al menos una foto como evidencia';
        }

        if (data.fotos.length > 10) {
            return 'No se pueden subir más de 10 fotos';
        }

        // Validar URLs de fotos
        for (let i = 0; i < data.fotos.length; i++) {
            const foto = data.fotos[i];
            if (typeof foto !== 'string' || foto.trim() === '') {
                return `La foto ${i + 1} debe ser una URL válida`;
            }

            // Validación básica de URL
            try {
                new URL(foto);
            } catch {
                return `La foto ${i + 1} no tiene un formato de URL válido`;
            }
        }

        // Validar peso total
        if (typeof data.pesoTotal !== 'number' || isNaN(data.pesoTotal)) {
            return 'El peso total debe ser un número válido';
        }

        if (data.pesoTotal <= 0) {
            return 'El peso total debe ser mayor a 0';
        }

        if (data.pesoTotal > 1000) {
            return 'El peso total no puede exceder 1000 kg';
        }

        // Validar detalle de material
        if (!data.detalleMaterial || !Array.isArray(data.detalleMaterial)) {
            return 'El detalle de material es requerido y debe ser un array';
        }

        if (data.detalleMaterial.length === 0) {
            return 'Debe especificar al menos un tipo de material';
        }

        if (data.detalleMaterial.length > 10) {
            return 'No se pueden especificar más de 10 tipos de materiales';
        }

        // Validar cada material
        let pesoTotalMateriales = 0;
        const tiposUsados = new Set<string>();

        for (let i = 0; i < data.detalleMaterial.length; i++) {
            const material = data.detalleMaterial[i];
            const materialError = this.validateMaterial(material, i);
            if (materialError) return materialError;

            // Verificar tipos duplicados
            if (tiposUsados.has(material.tipo)) {
                return `El tipo de material '${material.tipo}' está duplicado`;
            }
            tiposUsados.add(material.tipo);

            pesoTotalMateriales += material.cantidad;
        }

        // Verificar que el peso total coincida (con tolerancia del 5%)
        const diferencia = Math.abs(pesoTotalMateriales - data.pesoTotal);
        const tolerancia = data.pesoTotal * 0.05;
        if (diferencia > tolerancia) {
            return `La suma de los pesos de materiales (${pesoTotalMateriales} kg) no coincide con el peso total (${data.pesoTotal} kg)`;
        }

        // Validar cantidad de contenedores
        if (typeof data.cantidadContenedores !== 'number' || isNaN(data.cantidadContenedores)) {
            return 'La cantidad de contenedores debe ser un número válido';
        }

        if (data.cantidadContenedores < 1) {
            return 'Debe haber al menos 1 contenedor';
        }

        if (data.cantidadContenedores > 50) {
            return 'No se pueden especificar más de 50 contenedores';
        }

        if (!Number.isInteger(data.cantidadContenedores)) {
            return 'La cantidad de contenedores debe ser un número entero';
        }

        // Validar observaciones
        if (!data.observaciones || typeof data.observaciones !== 'string') {
            return 'Las observaciones son requeridas y deben ser una cadena';
        }

        if (data.observaciones.trim().length < 10) {
            return 'Las observaciones deben tener al menos 10 caracteres';
        }

        if (data.observaciones.length > 1000) {
            return 'Las observaciones no pueden exceder 1000 caracteres';
        }

        return null;
    }

    /**
     * Validar un material individual
     */
    private static validateMaterial(material: any, index: number): string | null {
        if (!material || typeof material !== 'object') {
            return `El material ${index + 1} debe ser un objeto válido`;
        }

        // Validar tipo
        if (!material.tipo || typeof material.tipo !== 'string') {
            return `El tipo del material ${index + 1} es requerido y debe ser una cadena`;
        }

        if (!Object.values(TipoMaterial).includes(material.tipo as TipoMaterial)) {
            return `El tipo '${material.tipo}' del material ${index + 1} no es válido. Tipos válidos: ${Object.values(TipoMaterial).join(', ')}`;
        }

        // Validar cantidad
        if (typeof material.cantidad !== 'number' || isNaN(material.cantidad)) {
            return `La cantidad del material ${index + 1} debe ser un número válido`;
        }

        if (material.cantidad <= 0) {
            return `La cantidad del material ${index + 1} debe ser mayor a 0`;
        }

        if (material.cantidad > 500) {
            return `La cantidad del material ${index + 1} no puede exceder 500 kg`;
        }

        // Validar precisión (máximo 2 decimales)
        if (Math.round(material.cantidad * 100) / 100 !== material.cantidad) {
            return `La cantidad del material ${index + 1} no puede tener más de 2 decimales`;
        }

        return null;
    }
}
