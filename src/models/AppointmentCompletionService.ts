// src/models/AppointmentCompletionService.ts
import { 
    collection, 
    doc, 
    getDoc,
    setDoc,
    updateDoc,
    runTransaction,
    Timestamp,
    serverTimestamp
} from 'firebase/firestore';
import { db } from './FirebaseService';
import { 
    IAppointment,
    IAppointmentCompletion, 
    ICompleteAppointmentRequest,
    IDetalleMaterial,
    ICreditCalculation,
    EstadoCita,
    TipoMaterial,
    CREDITOS_CONFIG,
    BONUS_CONFIG
} from '../types/appointment.types';

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

                const appointment = appointmentSnap.data() as IAppointment;

                // Verificar que la cita no esté ya completada
                if (appointment.estado === EstadoCita.COMPLETADA) {
                    throw new Error('La cita ya está completada');
                }

                // Verificar que la cita esté en un estado válido para completar
                if (appointment.estado === EstadoCita.CANCELADA) {
                    throw new Error('No se puede completar una cita cancelada');
                }

                // 2. Calcular créditos
                const creditCalculation = this.calculateCredits(
                    completionData.detalleMaterial,
                    completionData.pesoTotal,
                    completionData.cantidadContenedores
                );

                // 3. Crear el registro de finalización
                const now = new Date();
                const appointmentCompletion: IAppointmentCompletion = {
                    id: appointmentId,
                    fotos: completionData.fotos,
                    pesoTotal: completionData.pesoTotal,
                    detalleMaterial: completionData.detalleMaterial,
                    cantidadContenedores: completionData.cantidadContenedores,
                    observaciones: completionData.observaciones,
                    valorCalculado: this.calculateMonetaryValue(completionData.detalleMaterial),
                    creditosGenerados: creditCalculation.creditosTotal,
                    fechaCompletado: now
                };

                // 4. Guardar la finalización
                const completionRef = doc(db, this.COMPLETIONS_COLLECTION, appointmentId);
                transaction.set(completionRef, {
                    ...appointmentCompletion,
                    fechaCompletado: Timestamp.fromDate(now)
                });

                // 5. Actualizar el estado de la cita
                transaction.update(appointmentRef, {
                    estado: EstadoCita.COMPLETADA,
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

                const nuevosCreditosTotal = creditosActuales + creditCalculation.creditosTotal;

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
                    creditosGenerados: creditCalculation.creditosTotal,
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
     * Obtener una finalización de cita por ID
     */
    static async getAppointmentCompletion(appointmentId: string): Promise<IAppointmentCompletion | null> {
        try {
            const completionRef = doc(db, this.COMPLETIONS_COLLECTION, appointmentId);
            const completionSnap = await getDoc(completionRef);

            if (!completionSnap.exists()) {
                return null;
            }

            const data = completionSnap.data();
            return {
                id: completionSnap.id,
                fotos: data.fotos,
                pesoTotal: data.pesoTotal,
                detalleMaterial: data.detalleMaterial,
                cantidadContenedores: data.cantidadContenedores,
                observaciones: data.observaciones,
                valorCalculado: data.valorCalculado,
                creditosGenerados: data.creditosGenerados,
                fechaCompletado: data.fechaCompletado.toDate()
            };
        } catch (error) {
            console.error('Error getting appointment completion:', error);
            throw new Error('Error al obtener la finalización de la cita');
        }
    }

    /**
     * Calcular créditos basado en materiales y bonificaciones
     */
    private static calculateCredits(
        detalleMaterial: IDetalleMaterial[],
        pesoTotal: number,
        cantidadContenedores: number
    ): ICreditCalculation {
        let creditosBase = 0;
        let creditosBonus = 0;

        // Calcular créditos base por material
        detalleMaterial.forEach(material => {
            const config = CREDITOS_CONFIG[material.tipo];
            if (config) {
                const creditosMaterial = material.cantidad * config.creditosPorKg * config.multiplicador;
                creditosBase += Math.round(creditosMaterial);
            }
        });

        // Bonificación por peso alto
        if (pesoTotal >= BONUS_CONFIG.PESO_ALTO.umbral) {
            creditosBonus += Math.round(creditosBase * (BONUS_CONFIG.PESO_ALTO.multiplicador - 1));
        }

        // Bonificación por variedad de materiales
        const tiposUnicos = new Set(detalleMaterial.map(m => m.tipo)).size;
        if (tiposUnicos >= BONUS_CONFIG.VARIEDAD_MATERIALES.umbral) {
            creditosBonus += BONUS_CONFIG.VARIEDAD_MATERIALES.creditosBonus;
        }

        // Bonificación por múltiples contenedores
        if (cantidadContenedores >= BONUS_CONFIG.CONTENEDORES_MULTIPLES.umbral) {
            creditosBonus += BONUS_CONFIG.CONTENEDORES_MULTIPLES.creditosBonus;
        }

        const creditosTotal = creditosBase + creditosBonus;

        return {
            creditosPorKg: this.calculateAverageCreditPerKg(detalleMaterial),
            multiplicador: pesoTotal >= BONUS_CONFIG.PESO_ALTO.umbral ? BONUS_CONFIG.PESO_ALTO.multiplicador : 1.0,
            creditosBase,
            creditosBonus,
            creditosTotal
        };
    }

    /**
     * Calcular valor monetario estimado
     */
    private static calculateMonetaryValue(detalleMaterial: IDetalleMaterial[]): number {
        // Valores de referencia en pesos colombianos por kg
        const VALORES_MERCADO = {
            [TipoMaterial.PLASTICO]: 800,
            [TipoMaterial.PAPEL]: 600,
            [TipoMaterial.CARTON]: 400,
            [TipoMaterial.VIDRIO]: 200,
            [TipoMaterial.METAL]: 2000,
            [TipoMaterial.ELECTRONICO]: 5000,
            [TipoMaterial.ORGANICO]: 100,
            [TipoMaterial.TEXTIL]: 1200,
            [TipoMaterial.OTRO]: 300
        };

        let valorTotal = 0;

        detalleMaterial.forEach(material => {
            const valorPorKg = VALORES_MERCADO[material.tipo] || 0;
            valorTotal += material.cantidad * valorPorKg;
        });

        return Math.round(valorTotal);
    }

    /**
     * Calcular créditos promedio por kg
     */
    private static calculateAverageCreditPerKg(detalleMaterial: IDetalleMaterial[]): number {
        if (detalleMaterial.length === 0) return 0;

        let totalCreditos = 0;
        let totalPeso = 0;

        detalleMaterial.forEach(material => {
            const config = CREDITOS_CONFIG[material.tipo];
            if (config) {
                totalCreditos += material.cantidad * config.creditosPorKg * config.multiplicador;
                totalPeso += material.cantidad;
            }
        });

        return totalPeso > 0 ? Math.round(totalCreditos / totalPeso) : 0;
    }

    /**
     * Obtener estadísticas de finalización
     */
    static async getCompletionStats(appointmentId: string): Promise<{
        creditosGenerados: number;
        valorCalculado: number;
        pesoTotal: number;
        tiposMateriales: number;
        detalleCreditos: ICreditCalculation;
    }> {
        try {
            const completion = await this.getAppointmentCompletion(appointmentId);
            
            if (!completion) {
                throw new Error('Finalización de cita no encontrada');
            }

            const detalleCreditos = this.calculateCredits(
                completion.detalleMaterial,
                completion.pesoTotal,
                completion.cantidadContenedores
            );

            return {
                creditosGenerados: completion.creditosGenerados,
                valorCalculado: completion.valorCalculado,
                pesoTotal: completion.pesoTotal,
                tiposMateriales: new Set(completion.detalleMaterial.map(m => m.tipo)).size,
                detalleCreditos
            };
        } catch (error) {
            console.error('Error getting completion stats:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Error al obtener estadísticas de finalización');
        }
    }

    /**
     * Validar que una cita puede ser completada
     */
    static async canCompleteAppointment(appointmentId: string): Promise<{
        canComplete: boolean;
        reason?: string;
        appointment?: IAppointment;
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

            const appointment = appointmentSnap.data() as IAppointment;

            if (appointment.estado === EstadoCita.COMPLETADA) {
                return {
                    canComplete: false,
                    reason: 'La cita ya está completada',
                    appointment
                };
            }

            if (appointment.estado === EstadoCita.CANCELADA) {
                return {
                    canComplete: false,
                    reason: 'La cita está cancelada',
                    appointment
                };
            }

            return {
                canComplete: true,
                appointment
            };
        } catch (error) {
            console.error('Error checking if appointment can be completed:', error);
            throw new Error('Error al verificar si la cita puede ser completada');
        }
    }
}
