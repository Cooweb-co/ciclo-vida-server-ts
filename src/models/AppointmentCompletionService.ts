// src/models/AppointmentCompletionService.ts
import { 
    collection, 
    doc, 
    getDoc,
    setDoc,
    updateDoc,
    runTransaction,
    serverTimestamp
} from 'firebase/firestore';
import { db } from './FirebaseService';
import { 
    IAppointmentCompletion, 
    ICompleteAppointmentRequest,
    IDetalleMaterial,
    CREDITOS_POR_MATERIAL,
    VALORES_MERCADO
} from '../types/appointmentCompletion.types';

export class AppointmentCompletionService {
    private static readonly APPOINTMENTS_COLLECTION = 'appointments';
    private static readonly COMPLETIONS_COLLECTION = 'appointmentCompletions';
    private static readonly USERS_COLLECTION = 'users';

    /**
     * Completar una cita con evidencias y calcular créditos
     */
    static async completeAppointment(
        appointmentId: string, 
        completionData: ICompleteAppointmentRequest
    ): Promise<{
        appointmentCompletion: IAppointmentCompletion;
        creditosGenerados: number;
        creditosTotal: number;
    }> {
        try {
            // Usar transacción para garantizar consistencia
            const result = await runTransaction(db, async (transaction) => {
                // 1. Obtener la cita
                const appointmentRef = doc(db, this.APPOINTMENTS_COLLECTION, appointmentId);
                const appointmentSnap = await transaction.get(appointmentRef);

                if (!appointmentSnap.exists()) {
                    throw new Error('Cita no encontrada');
                }

                const appointment = appointmentSnap.data();

                // Verificar que la cita no esté ya completada
                if (appointment.estado === 'completada') {
                    throw new Error('La cita ya está completada');
                }

                // 2. Calcular créditos y valor monetario
                const creditosGenerados = this.calculateCredits(completionData.detalleMaterial, completionData.pesoTotal);
                const valorCalculado = this.calculateMonetaryValue(completionData.detalleMaterial);

                // 3. Crear el registro de finalización
                const appointmentCompletion: IAppointmentCompletion = {
                    id: appointmentId,
                    fotos: completionData.fotos,
                    pesoTotal: completionData.pesoTotal,
                    detalleMaterial: completionData.detalleMaterial,
                    cantidadContenedores: completionData.cantidadContenedores,
                    observaciones: completionData.observaciones,
                    valorCalculado: valorCalculado
                };

                // 4. Guardar la finalización en appointmentCompletions
                const completionRef = doc(db, this.COMPLETIONS_COLLECTION, appointmentId);
                transaction.set(completionRef, appointmentCompletion);

                // 5. Actualizar el estado de la cita a 'completada'
                transaction.update(appointmentRef, {
                    estado: 'completada',
                    fechaActualizacion: serverTimestamp()
                });

                // 6. Obtener y actualizar créditos del usuario
                const userRef = doc(db, this.USERS_COLLECTION, appointment.usuarioId);
                const userSnap = await transaction.get(userRef);

                let creditosActuales = 0;
                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    creditosActuales = userData.creditos || 0;
                }

                const nuevosCreditosTotal = creditosActuales + creditosGenerados;

                // Actualizar o crear el documento del usuario
                if (userSnap.exists()) {
                    transaction.update(userRef, {
                        creditos: nuevosCreditosTotal,
                        fechaActualizacion: serverTimestamp()
                    });
                } else {
                    transaction.set(userRef, {
                        id: appointment.usuarioId,
                        creditos: nuevosCreditosTotal,
                        fechaCreacion: serverTimestamp(),
                        fechaActualizacion: serverTimestamp()
                    });
                }

                return {
                    appointmentCompletion,
                    creditosGenerados,
                    creditosTotal: nuevosCreditosTotal
                };
            });

            return result;
        } catch (error) {
            console.error('Error completing appointment:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Error al completar la cita');
        }
    }

    /**
     * Calcular créditos basado en materiales y peso
     */
    private static calculateCredits(detalleMaterial: IDetalleMaterial[], pesoTotal: number): number {
        let creditosBase = 0;

        // Calcular créditos base por material
        detalleMaterial.forEach(material => {
            const creditosPorKg = CREDITOS_POR_MATERIAL[material.tipo.toLowerCase()] || CREDITOS_POR_MATERIAL['otro'];
            creditosBase += material.cantidad * creditosPorKg;
        });

        // Bonificación por peso alto (más de 20kg = 20% extra)
        if (pesoTotal > 20) {
            creditosBase = Math.round(creditosBase * 1.2);
        }

        // Bonificación por variedad de materiales (3 o más tipos = +50 créditos)
        const tiposUnicos = new Set(detalleMaterial.map(m => m.tipo.toLowerCase())).size;
        if (tiposUnicos >= 3) {
            creditosBase += 50;
        }

        return Math.round(creditosBase);
    }

    /**
     * Calcular valor monetario estimado
     */
    private static calculateMonetaryValue(detalleMaterial: IDetalleMaterial[]): number {
        let valorTotal = 0;

        detalleMaterial.forEach(material => {
            const valorPorKg = VALORES_MERCADO[material.tipo.toLowerCase()] || VALORES_MERCADO['otro'];
            valorTotal += material.cantidad * valorPorKg;
        });

        return Math.round(valorTotal);
    }

    /**
     * Verificar que una cita puede ser completada
     */
    static async canCompleteAppointment(appointmentId: string): Promise<{
        canComplete: boolean;
        reason?: string;
    }> {
        try {
            const appointmentRef = doc(db, this.APPOINTMENTS_COLLECTION, appointmentId);
            const appointmentSnap = await getDoc(appointmentRef);

            if (!appointmentSnap.exists()) {
                return {
                    canComplete: false,
                    reason: 'Cita no encontrada'
                };
            }

            const appointment = appointmentSnap.data();

            if (appointment.estado === 'completada') {
                return {
                    canComplete: false,
                    reason: 'La cita ya está completada'
                };
            }

            if (appointment.estado === 'cancelada') {
                return {
                    canComplete: false,
                    reason: 'La cita está cancelada'
                };
            }

            return {
                canComplete: true
            };
        } catch (error) {
            console.error('Error checking if appointment can be completed:', error);
            throw new Error('Error al verificar si la cita puede ser completada');
        }
    }
}
