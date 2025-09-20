// src/controllers/appointmentCompletion.controller.ts
import { Request, Response } from 'express';
import { AppointmentCompletionService } from '../models/AppointmentCompletionService';
import { ICompleteAppointmentRequest, IDetalleMaterial } from '../types/appointmentCompletion.types';

export class AppointmentCompletionController {
    /**
     * Completar una cita con evidencias
     * POST /appointments/:id/complete
     */
    static async completeAppointment(req: Request, res: Response): Promise<void> {
        try {
            console.log('🚀 [CONTROLLER] Iniciando completeAppointment');
            const { id: appointmentId } = req.params;
            const completionData: ICompleteAppointmentRequest = req.body;
            
            console.log('🔄 [CONTROLLER] Parámetros recibidos:', { appointmentId });
            console.log('🔄 [CONTROLLER] Datos del body:', completionData);

            // Validar ID de la cita
            if (!appointmentId || appointmentId.trim() === '') {
                console.log('❌ [CONTROLLER] ID de cita inválido');
                res.status(400).json({ 
                    success: false,
                    error: 'ID de cita inválido' 
                });
                return;
            }

            // Validar datos de entrada
            console.log('🔄 [CONTROLLER] Validando datos de entrada...');
            const validationError = AppointmentCompletionController.validateCompletionData(completionData);
            if (validationError) {
                console.log('❌ [CONTROLLER] Error de validación:', validationError);
                res.status(400).json({ 
                    success: false,
                    error: 'Datos de entrada inválidos', 
                    details: validationError 
                });
                return;
            }
            console.log('✅ [CONTROLLER] Validación exitosa');

            // Verificar si la cita puede ser completada
            console.log('🔄 [CONTROLLER] Verificando si la cita puede ser completada...');
            const canComplete = await AppointmentCompletionService.canCompleteAppointment(appointmentId);
            console.log('🔄 [CONTROLLER] Resultado de verificación:', canComplete);
            if (!canComplete.canComplete) {
                console.log('❌ [CONTROLLER] La cita no puede ser completada:', canComplete.reason);
                res.status(400).json({ 
                    success: false,
                    error: 'No se puede completar la cita',
                    reason: canComplete.reason
                });
                return;
            }

            // Completar la cita
            console.log('🔄 [CONTROLLER] Llamando al servicio para completar la cita...');
            const result = await AppointmentCompletionService.completeAppointment(
                appointmentId, 
                completionData
            );
            console.log('✅ [CONTROLLER] Cita completada exitosamente:', result);

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
            console.error('❌ [CONTROLLER] Error en completeAppointment:', error);
            console.error('❌ [CONTROLLER] Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
            
            if (error instanceof Error) {
                if (error.message.includes('no encontrada')) {
                    console.log('❌ [CONTROLLER] Cita no encontrada');
                    res.status(404).json({ 
                        success: false,
                        error: 'Cita no encontrada',
                        message: error.message
                    });
                    return;
                }

                if (error.message.includes('ya está completada') || 
                    error.message.includes('cancelada')) {
                    console.log('❌ [CONTROLLER] Estado de cita inválido');
                    res.status(409).json({ 
                        success: false,
                        error: 'Estado de cita inválido',
                        message: error.message
                    });
                    return;
                }
            }

            console.log('❌ [CONTROLLER] Error interno del servidor');
            res.status(500).json({ 
                success: false,
                error: 'Error interno del servidor',
                message: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    /**
     * Validar datos para completar una cita (solo campos requeridos)
     */
    private static validateCompletionData(data: any): string | null {
        if (!data) {
            return 'Los datos de finalización son requeridos';
        }

        // Validar fotos (requeridas)
        if (!data.fotos || !Array.isArray(data.fotos)) {
            return 'Las fotos son requeridas y deben ser un array';
        }

        if (data.fotos.length === 0) {
            return 'Debe proporcionar al menos una foto como evidencia';
        }

        // Validar URLs de fotos (básico)
        for (let i = 0; i < data.fotos.length; i++) {
            const foto = data.fotos[i];
            if (typeof foto !== 'string' || foto.trim() === '') {
                return `La foto ${i + 1} debe ser una URL válida`;
            }
        }

        // Validar peso total (requerido)
        if (typeof data.pesoTotal !== 'number' || isNaN(data.pesoTotal)) {
            return 'El peso total debe ser un número válido';
        }

        if (data.pesoTotal <= 0) {
            return 'El peso total debe ser mayor a 0';
        }

        // Validar detalle de material (requerido)
        if (!data.detalleMaterial || !Array.isArray(data.detalleMaterial)) {
            return 'El detalle de material es requerido y debe ser un array';
        }

        if (data.detalleMaterial.length === 0) {
            return 'Debe especificar al menos un tipo de material';
        }

        // Validar cada material (básico)
        for (let i = 0; i < data.detalleMaterial.length; i++) {
            const material = data.detalleMaterial[i];
            const materialError = this.validateMaterial(material, i);
            if (materialError) return materialError;
        }

        // Validar cantidad de contenedores (requerido)
        if (typeof data.cantidadContenedores !== 'number' || isNaN(data.cantidadContenedores)) {
            return 'La cantidad de contenedores debe ser un número válido';
        }

        if (data.cantidadContenedores < 1) {
            return 'Debe haber al menos 1 contenedor';
        }

        if (!Number.isInteger(data.cantidadContenedores)) {
            return 'La cantidad de contenedores debe ser un número entero';
        }

        // Validar observaciones (requeridas)
        if (!data.observaciones || typeof data.observaciones !== 'string') {
            return 'Las observaciones son requeridas y deben ser una cadena';
        }

        if (data.observaciones.trim().length === 0) {
            return 'Las observaciones no pueden estar vacías';
        }

        return null;
    }

    /**
     * Validar un material individual (solo campos requeridos)
     */
    private static validateMaterial(material: any, index: number): string | null {
        if (!material || typeof material !== 'object') {
            return `El material ${index + 1} debe ser un objeto válido`;
        }

        // Validar tipo (requerido)
        if (!material.tipo || typeof material.tipo !== 'string') {
            return `El tipo del material ${index + 1} es requerido y debe ser una cadena`;
        }

        if (material.tipo.trim().length === 0) {
            return `El tipo del material ${index + 1} no puede estar vacío`;
        }

        // Validar cantidad (requerida)
        if (typeof material.cantidad !== 'number' || isNaN(material.cantidad)) {
            return `La cantidad del material ${index + 1} debe ser un número válido`;
        }

        if (material.cantidad <= 0) {
            return `La cantidad del material ${index + 1} debe ser mayor a 0`;
        }

        return null;
    }
}
