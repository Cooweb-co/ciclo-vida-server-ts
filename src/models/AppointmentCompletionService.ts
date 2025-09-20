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
            console.log('🔄 [DEBUG] Iniciando completar cita:', { appointmentId, completionData });
            
            // Usar transacción para garantizar consistencia
            const result = await runTransaction(db, async (transaction) => {
                console.log('🔄 [DEBUG] Iniciando transacción Firebase');
                
                // ========== FASE 1: TODAS LAS LECTURAS PRIMERO ==========
                
                // 1. Obtener la cita
                const appointmentRef = doc(db, this.APPOINTMENTS_COLLECTION, appointmentId);
                console.log('🔄 [DEBUG] Referencia de cita creada:', appointmentRef.path);
                
                const appointmentSnap = await transaction.get(appointmentRef);
                console.log('🔄 [DEBUG] Snapshot obtenido, existe:', appointmentSnap.exists());

                if (!appointmentSnap.exists()) {
                    console.log('❌ [DEBUG] Cita no encontrada en Firebase');
                    throw new Error('Cita no encontrada');
                }

                const appointment = appointmentSnap.data();
                console.log('🔄 [DEBUG] Datos de la cita obtenidos:', appointment);

                // Verificar que la cita no esté ya completada
                console.log('🔄 [DEBUG] Estado actual de la cita:', appointment.estado);
                if (appointment.estado === 'completada') {
                    console.log('❌ [DEBUG] La cita ya está completada');
                    throw new Error('La cita ya está completada');
                }

                // 2. Obtener el usuario ANTES de hacer cualquier escritura
                console.log('🔄 [DEBUG] Obteniendo usuario con clienteId:', appointment.clienteId);
                const userRef = doc(db, this.USERS_COLLECTION, appointment.clienteId);
                console.log('🔄 [DEBUG] Referencia de usuario:', userRef.path);
                const userSnap = await transaction.get(userRef);
                console.log('🔄 [DEBUG] Usuario existe:', userSnap.exists());

                let creditosActuales = 0;
                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    creditosActuales = userData.creditos || 0;
                    console.log('🔄 [DEBUG] Créditos actuales del usuario:', creditosActuales);
                    console.log('🔄 [DEBUG] Datos del usuario:', userData);
                } else {
                    console.log('🔄 [DEBUG] Usuario no existe, se creará nuevo');
                }

                // ========== FASE 2: CÁLCULOS (NO REQUIEREN FIREBASE) ==========
                
                // 3. Calcular créditos y valor monetario
                console.log('🔄 [DEBUG] Calculando créditos y valor monetario...');
                const creditosGenerados = this.calculateCredits(completionData.detalleMaterial, completionData.pesoTotal);
                const valorCalculado = this.calculateMonetaryValue(completionData.detalleMaterial);
                console.log('🔄 [DEBUG] Créditos generados:', creditosGenerados);
                console.log('🔄 [DEBUG] Valor calculado:', valorCalculado);

                const nuevosCreditosTotal = creditosActuales + creditosGenerados;
                console.log('🔄 [DEBUG] Nuevos créditos totales:', nuevosCreditosTotal);

                // 4. Crear el registro de finalización
                const appointmentCompletion: IAppointmentCompletion = {
                    id: appointmentId,
                    fotos: completionData.fotos,
                    pesoTotal: completionData.pesoTotal,
                    detalleMaterial: completionData.detalleMaterial,
                    cantidadContenedores: completionData.cantidadContenedores,
                    observaciones: completionData.observaciones,
                    valorCalculado: valorCalculado
                };
                console.log('🔄 [DEBUG] Registro de finalización creado:', appointmentCompletion);

                // ========== FASE 3: TODAS LAS ESCRITURAS AL FINAL ==========
                
                // 5. Guardar la finalización en appointmentCompletions
                const completionRef = doc(db, this.COMPLETIONS_COLLECTION, appointmentId);
                console.log('🔄 [DEBUG] Guardando finalización en:', completionRef.path);
                transaction.set(completionRef, appointmentCompletion);

                // 6. Actualizar el estado de la cita a 'completada'
                console.log('🔄 [DEBUG] Actualizando estado de cita a completada');
                transaction.update(appointmentRef, {
                    estado: 'completada',
                    fechaActualizacion: serverTimestamp()
                });

                // 7. Actualizar o crear el documento del usuario
                if (userSnap.exists()) {
                    console.log('🔄 [DEBUG] Actualizando usuario existente');
                    transaction.update(userRef, {
                        creditos: nuevosCreditosTotal,
                        fechaActualizacion: serverTimestamp()
                    });
                } else {
                    console.log('🔄 [DEBUG] Creando nuevo usuario');
                    transaction.set(userRef, {
                        id: appointment.clienteId,
                        creditos: nuevosCreditosTotal,
                        fechaCreacion: serverTimestamp(),
                        fechaActualizacion: serverTimestamp()
                    });
                }

                console.log('🔄 [DEBUG] Preparando resultado final');
                return {
                    appointmentCompletion,
                    creditosGenerados,
                    creditosTotal: nuevosCreditosTotal
                };
            });

            console.log('✅ [DEBUG] Transacción completada exitosamente:', result);
            return result;
        } catch (error) {
            console.error('❌ [DEBUG] Error en completeAppointment:', error);
            console.error('❌ [DEBUG] Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
            throw error;
        }
    }

    /**
     * Calcular créditos basado en materiales y peso
     */
    private static calculateCredits(detalleMaterial: IDetalleMaterial[], pesoTotal: number): number {
        console.log('🔄 [DEBUG] Calculando créditos con:', { detalleMaterial, pesoTotal });
        let creditosBase = 0;

        // Calcular créditos base por material
        detalleMaterial.forEach(material => {
            const creditosPorKg = CREDITOS_POR_MATERIAL[material.tipo.toLowerCase()] || CREDITOS_POR_MATERIAL['otro'];
            const creditosMaterial = material.cantidad * creditosPorKg;
            console.log(`🔄 [DEBUG] Material ${material.tipo}: ${material.cantidad}kg x ${creditosPorKg} = ${creditosMaterial} créditos`);
            creditosBase += creditosMaterial;
        });
        console.log('🔄 [DEBUG] Créditos base:', creditosBase);

        // Bonificación por peso alto (más de 20kg = 20% extra)
        if (pesoTotal > 20) {
            const creditosAnteriores = creditosBase;
            creditosBase = Math.round(creditosBase * 1.2);
            console.log(`🔄 [DEBUG] Bonificación por peso alto: ${creditosAnteriores} -> ${creditosBase}`);
        }

        // Bonificación por variedad de materiales (3 o más tipos = +50 créditos)
        const tiposUnicos = new Set(detalleMaterial.map(m => m.tipo.toLowerCase())).size;
        if (tiposUnicos >= 3) {
            creditosBase += 50;
            console.log(`🔄 [DEBUG] Bonificación por variedad (${tiposUnicos} tipos): +50 créditos`);
        }

        const creditosFinales = Math.round(creditosBase);
        console.log('🔄 [DEBUG] Créditos finales:', creditosFinales);
        return creditosFinales;
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
            console.log('🔄 [DEBUG] Verificando si se puede completar cita:', appointmentId);
            const appointmentRef = doc(db, this.APPOINTMENTS_COLLECTION, appointmentId);
            const appointmentSnap = await getDoc(appointmentRef);
            console.log('🔄 [DEBUG] Cita existe en canCompleteAppointment:', appointmentSnap.exists());

            if (!appointmentSnap.exists()) {
                console.log('❌ [DEBUG] Cita no encontrada en canCompleteAppointment');
                return {
                    canComplete: false,
                    reason: 'Cita no encontrada'
                };
            }

            const appointment = appointmentSnap.data();
            console.log('🔄 [DEBUG] Estado de cita en canCompleteAppointment:', appointment.estado);

            if (appointment.estado === 'completada') {
                console.log('❌ [DEBUG] La cita ya está completada en canCompleteAppointment');
                return {
                    canComplete: false,
                    reason: 'La cita ya está completada'
                };
            }

            if (appointment.estado === 'cancelada') {
                console.log('❌ [DEBUG] La cita está cancelada en canCompleteAppointment');
                return {
                    canComplete: false,
                    reason: 'La cita está cancelada'
                };
            }

            console.log('✅ [DEBUG] La cita puede ser completada');
            return {
                canComplete: true
            };
        } catch (error) {
            console.error('❌ [DEBUG] Error en canCompleteAppointment:', error);
            throw new Error('Error al verificar si la cita puede ser completada');
        }
    }
}
