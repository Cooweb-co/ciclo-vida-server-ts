// src/models/CreditsCouponsService.ts
import { 
    collection, 
    doc, 
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    query,
    where,
    orderBy,
    runTransaction,
    Timestamp,
    serverTimestamp
} from 'firebase/firestore';
import { db } from './FirebaseService';
import { 
    IUser,
    ICoupon,
    IClaimedCoupon,
    IClaimCouponRequest,
    EstadoCuponReclamado,
    ICreditTransaction,
    TipoTransaccion
} from '../types/credits.types';

export class CreditsCouponsService {
    private static readonly USERS_COLLECTION = 'users';
    private static readonly COUPONS_COLLECTION = 'coupons';
    private static readonly CLAIMED_COUPONS_COLLECTION = 'claimedCoupons';
    private static readonly CREDIT_TRANSACTIONS_COLLECTION = 'creditTransactions';

    /**
     * Obtener créditos de un usuario
     */
    static async getUserCredits(usuarioId: string): Promise<{
        usuarioId: string;
        creditos: number;
        fechaActualizacion: Date;
    } | null> {
        try {
            const userRef = doc(db, this.USERS_COLLECTION, usuarioId);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                return null;
            }

            const userData = userSnap.data();
            return {
                usuarioId: userSnap.id,
                creditos: userData.creditos || 0,
                fechaActualizacion: userData.fechaActualizacion?.toDate() || new Date()
            };
        } catch (error) {
            console.error('Error getting user credits:', error);
            throw new Error('Error al obtener los créditos del usuario');
        }
    }

    /**
     * Obtener todos los cupones activos
     */
    static async getAllCoupons(): Promise<ICoupon[]> {
        try {
            const couponsCollection = collection(db, this.COUPONS_COLLECTION);
            const activeCouponsQuery = query(
                couponsCollection,
                where('activo', '==', true),
                orderBy('costoCreditosRequeridos', 'asc')
            );

            const querySnapshot = await getDocs(activeCouponsQuery);
            const coupons: ICoupon[] = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                coupons.push({
                    id: doc.id,
                    titulo: data.titulo,
                    descripcion: data.descripcion,
                    costoCreditosRequeridos: data.costoCreditosRequeridos,
                    categoria: data.categoria,
                    empresa: data.empresa,
                    valorDescuento: data.valorDescuento,
                    porcentajeDescuento: data.porcentajeDescuento,
                    fechaVencimiento: data.fechaVencimiento?.toDate(),
                    imagenUrl: data.imagenUrl,
                    terminosCondiciones: data.terminosCondiciones,
                    cantidadDisponible: data.cantidadDisponible,
                    activo: data.activo,
                    fechaCreacion: data.fechaCreacion.toDate(),
                    fechaActualizacion: data.fechaActualizacion.toDate()
                });
            });

            return coupons;
        } catch (error) {
            console.error('Error getting coupons:', error);
            throw new Error('Error al obtener los cupones');
        }
    }

    /**
     * Reclamar un cupón
     */
    static async claimCoupon(usuarioId: string, couponId: string): Promise<{
        claimedCoupon: IClaimedCoupon;
        creditosRestantes: number;
        codigoCanjeado: string;
    }> {
        try {
            const result = await runTransaction(db, async (transaction) => {
                // 1. Obtener datos del usuario
                const userRef = doc(db, this.USERS_COLLECTION, usuarioId);
                const userSnap = await transaction.get(userRef);

                if (!userSnap.exists()) {
                    throw new Error('Usuario no encontrado');
                }

                const userData = userSnap.data();
                const creditosActuales = userData.creditos || 0;

                // 2. Obtener datos del cupón
                const couponRef = doc(db, this.COUPONS_COLLECTION, couponId);
                const couponSnap = await transaction.get(couponRef);

                if (!couponSnap.exists()) {
                    throw new Error('Cupón no encontrado');
                }

                const couponData = couponSnap.data();

                // Validar que el cupón esté activo
                if (!couponData.activo) {
                    throw new Error('El cupón no está disponible');
                }

                // Validar fecha de vencimiento del cupón
                if (couponData.fechaVencimiento && couponData.fechaVencimiento.toDate() < new Date()) {
                    throw new Error('El cupón ha vencido');
                }

                // Validar cantidad disponible
                if (couponData.cantidadDisponible !== undefined && couponData.cantidadDisponible <= 0) {
                    throw new Error('El cupón no tiene unidades disponibles');
                }

                // 3. Validar créditos suficientes
                const costoCupon = couponData.costoCreditosRequeridos;
                if (creditosActuales < costoCupon) {
                    throw new Error(`Créditos insuficientes. Necesitas ${costoCupon} créditos, tienes ${creditosActuales}`);
                }

                // 4. Verificar si el usuario ya reclamó este cupón
                const existingClaimQuery = query(
                    collection(db, this.CLAIMED_COUPONS_COLLECTION),
                    where('usuarioId', '==', usuarioId),
                    where('couponId', '==', couponId),
                    where('estado', 'in', [EstadoCuponReclamado.ACTIVO, EstadoCuponReclamado.USADO])
                );
                const existingClaimSnap = await getDocs(existingClaimQuery);

                if (!existingClaimSnap.empty) {
                    throw new Error('Ya has reclamado este cupón anteriormente');
                }

                // 5. Generar código único para canjear
                const codigoCanjeado = this.generateCouponCode();

                // 6. Crear registro de cupón reclamado
                const now = new Date();
                const fechaVencimientoCupon = couponData.fechaVencimiento?.toDate() || 
                    new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 días por defecto

                const claimedCoupon: Omit<IClaimedCoupon, 'id'> = {
                    usuarioId,
                    couponId,
                    fecha: now,
                    estado: EstadoCuponReclamado.ACTIVO,
                    codigoCanjeado,
                    fechaVencimiento: fechaVencimientoCupon
                };

                const claimedCouponRef = await addDoc(
                    collection(db, this.CLAIMED_COUPONS_COLLECTION),
                    {
                        ...claimedCoupon,
                        fecha: Timestamp.fromDate(now),
                        fechaVencimiento: Timestamp.fromDate(fechaVencimientoCupon)
                    }
                );

                // 7. Restar créditos del usuario
                const nuevosCreditosTotal = creditosActuales - costoCupon;
                transaction.update(userRef, {
                    creditos: nuevosCreditosTotal,
                    fechaActualizacion: serverTimestamp()
                });

                // 8. Actualizar cantidad disponible del cupón si aplica
                if (couponData.cantidadDisponible !== undefined) {
                    transaction.update(couponRef, {
                        cantidadDisponible: couponData.cantidadDisponible - 1,
                        fechaActualizacion: serverTimestamp()
                    });
                }

                // 9. Crear registro de transacción de créditos
                const creditTransaction = {
                    usuarioId,
                    tipo: TipoTransaccion.GASTADOS,
                    cantidad: -costoCupon,
                    descripcion: `Cupón reclamado: ${couponData.titulo}`,
                    referencia: claimedCouponRef.id,
                    fecha: Timestamp.fromDate(now)
                };

                await addDoc(collection(db, this.CREDIT_TRANSACTIONS_COLLECTION), creditTransaction);

                return {
                    claimedCoupon: {
                        id: claimedCouponRef.id,
                        ...claimedCoupon
                    },
                    creditosRestantes: nuevosCreditosTotal,
                    codigoCanjeado
                };
            });

            return result;
        } catch (error) {
            console.error('Error claiming coupon:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Error al reclamar el cupón');
        }
    }

    /**
     * Obtener cupones reclamados por un usuario
     */
    static async getUserClaimedCoupons(usuarioId: string): Promise<IClaimedCoupon[]> {
        try {
            const claimedCouponsCollection = collection(db, this.CLAIMED_COUPONS_COLLECTION);
            const userClaimedQuery = query(
                claimedCouponsCollection,
                where('usuarioId', '==', usuarioId),
                orderBy('fecha', 'desc')
            );

            const querySnapshot = await getDocs(userClaimedQuery);
            const claimedCoupons: IClaimedCoupon[] = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                claimedCoupons.push({
                    id: doc.id,
                    usuarioId: data.usuarioId,
                    couponId: data.couponId,
                    fecha: data.fecha.toDate(),
                    estado: data.estado as EstadoCuponReclamado,
                    codigoCanjeado: data.codigoCanjeado,
                    fechaVencimiento: data.fechaVencimiento?.toDate(),
                    fechaUsado: data.fechaUsado?.toDate()
                });
            });

            return claimedCoupons;
        } catch (error) {
            console.error('Error getting user claimed coupons:', error);
            throw new Error('Error al obtener los cupones reclamados del usuario');
        }
    }

    /**
     * Obtener un cupón por ID
     */
    static async getCouponById(couponId: string): Promise<ICoupon | null> {
        try {
            const couponRef = doc(db, this.COUPONS_COLLECTION, couponId);
            const couponSnap = await getDoc(couponRef);

            if (!couponSnap.exists()) {
                return null;
            }

            const data = couponSnap.data();
            return {
                id: couponSnap.id,
                titulo: data.titulo,
                descripcion: data.descripcion,
                costoCreditosRequeridos: data.costoCreditosRequeridos,
                categoria: data.categoria,
                empresa: data.empresa,
                valorDescuento: data.valorDescuento,
                porcentajeDescuento: data.porcentajeDescuento,
                fechaVencimiento: data.fechaVencimiento?.toDate(),
                imagenUrl: data.imagenUrl,
                terminosCondiciones: data.terminosCondiciones,
                cantidadDisponible: data.cantidadDisponible,
                activo: data.activo,
                fechaCreacion: data.fechaCreacion.toDate(),
                fechaActualizacion: data.fechaActualizacion.toDate()
            };
        } catch (error) {
            console.error('Error getting coupon by ID:', error);
            throw new Error('Error al obtener el cupón');
        }
    }

    /**
     * Obtener historial de transacciones de créditos de un usuario
     */
    static async getUserCreditHistory(usuarioId: string): Promise<ICreditTransaction[]> {
        try {
            const transactionsCollection = collection(db, this.CREDIT_TRANSACTIONS_COLLECTION);
            const userTransactionsQuery = query(
                transactionsCollection,
                where('usuarioId', '==', usuarioId),
                orderBy('fecha', 'desc')
            );

            const querySnapshot = await getDocs(userTransactionsQuery);
            const transactions: ICreditTransaction[] = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                transactions.push({
                    id: doc.id,
                    usuarioId: data.usuarioId,
                    tipo: data.tipo as TipoTransaccion,
                    cantidad: data.cantidad,
                    descripcion: data.descripcion,
                    referencia: data.referencia,
                    fecha: data.fecha.toDate()
                });
            });

            return transactions;
        } catch (error) {
            console.error('Error getting user credit history:', error);
            throw new Error('Error al obtener el historial de créditos');
        }
    }

    /**
     * Generar código único para cupón
     */
    private static generateCouponCode(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        
        // Formato: XXXX-XXXX-XXXX
        for (let i = 0; i < 12; i++) {
            if (i === 4 || i === 8) {
                result += '-';
            }
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        return result;
    }

    /**
     * Validar si un usuario puede reclamar un cupón
     */
    static async canClaimCoupon(usuarioId: string, couponId: string): Promise<{
        canClaim: boolean;
        reason?: string;
        creditosNecesarios?: number;
        creditosActuales?: number;
    }> {
        try {
            // Obtener créditos del usuario
            const userCredits = await this.getUserCredits(usuarioId);
            if (!userCredits) {
                return {
                    canClaim: false,
                    reason: 'Usuario no encontrado'
                };
            }

            // Obtener datos del cupón
            const coupon = await this.getCouponById(couponId);
            if (!coupon) {
                return {
                    canClaim: false,
                    reason: 'Cupón no encontrado'
                };
            }

            if (!coupon.activo) {
                return {
                    canClaim: false,
                    reason: 'El cupón no está disponible'
                };
            }

            if (coupon.fechaVencimiento && coupon.fechaVencimiento < new Date()) {
                return {
                    canClaim: false,
                    reason: 'El cupón ha vencido'
                };
            }

            if (coupon.cantidadDisponible !== undefined && coupon.cantidadDisponible <= 0) {
                return {
                    canClaim: false,
                    reason: 'El cupón no tiene unidades disponibles'
                };
            }

            if (userCredits.creditos < coupon.costoCreditosRequeridos) {
                return {
                    canClaim: false,
                    reason: 'Créditos insuficientes',
                    creditosNecesarios: coupon.costoCreditosRequeridos,
                    creditosActuales: userCredits.creditos
                };
            }

            // Verificar si ya reclamó este cupón
            const claimedCoupons = await this.getUserClaimedCoupons(usuarioId);
            const alreadyClaimed = claimedCoupons.some(claimed => 
                claimed.couponId === couponId && 
                (claimed.estado === EstadoCuponReclamado.ACTIVO || claimed.estado === EstadoCuponReclamado.USADO)
            );

            if (alreadyClaimed) {
                return {
                    canClaim: false,
                    reason: 'Ya has reclamado este cupón anteriormente'
                };
            }

            return {
                canClaim: true,
                creditosNecesarios: coupon.costoCreditosRequeridos,
                creditosActuales: userCredits.creditos
            };
        } catch (error) {
            console.error('Error checking if user can claim coupon:', error);
            throw new Error('Error al verificar si se puede reclamar el cupón');
        }
    }
}
