// src/controllers/credits.controller.ts
import { Request, Response } from 'express';
import { CreditsCouponsService } from '../models/CreditsCouponsService';
import { IClaimCouponRequest } from '../types/credits.types';

export class CreditsController {
    /**
     * Obtener créditos de un usuario
     * GET /users/:id/credits
     */
    static async getUserCredits(req: Request, res: Response): Promise<void> {
        try {
            const { id: usuarioId } = req.params;

            // Validar ID del usuario
            if (!usuarioId || usuarioId.trim() === '') {
                res.status(400).json({ 
                    success: false,
                    error: 'ID de usuario inválido' 
                });
                return;
            }

            const userCredits = await CreditsCouponsService.getUserCredits(usuarioId);

            if (!userCredits) {
                res.status(404).json({ 
                    success: false,
                    error: 'Usuario no encontrado' 
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: userCredits
            });
        } catch (error) {
            console.error('Error in getUserCredits:', error);
            res.status(500).json({ 
                success: false,
                error: 'Error interno del servidor',
                message: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    /**
     * Listar todos los cupones activos
     * GET /coupons
     */
    static async getAllCoupons(req: Request, res: Response): Promise<void> {
        try {
            const { categoria, empresa } = req.query;

            let coupons = await CreditsCouponsService.getAllCoupons();

            // Filtrar por categoría si se proporciona
            if (categoria && typeof categoria === 'string') {
                coupons = coupons.filter(coupon => 
                    coupon.categoria.toLowerCase().includes(categoria.toLowerCase())
                );
            }

            // Filtrar por empresa si se proporciona
            if (empresa && typeof empresa === 'string') {
                coupons = coupons.filter(coupon => 
                    coupon.empresa.toLowerCase().includes(empresa.toLowerCase())
                );
            }

            res.status(200).json({
                success: true,
                data: coupons,
                count: coupons.length
            });
        } catch (error) {
            console.error('Error in getAllCoupons:', error);
            res.status(500).json({ 
                success: false,
                error: 'Error interno del servidor',
                message: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    /**
     * Reclamar un cupón
     * POST /users/:id/claim-coupon
     */
    static async claimCoupon(req: Request, res: Response): Promise<void> {
        try {
            const { id: usuarioId } = req.params;
            const { couponId }: IClaimCouponRequest = req.body;

            // Validar ID del usuario
            if (!usuarioId || usuarioId.trim() === '') {
                res.status(400).json({ 
                    success: false,
                    error: 'ID de usuario inválido' 
                });
                return;
            }

            // Validar datos de entrada
            const validationError = CreditsController.validateClaimCouponData({ couponId });
            if (validationError) {
                res.status(400).json({ 
                    success: false,
                    error: 'Datos de entrada inválidos', 
                    details: validationError 
                });
                return;
            }

            // Verificar si el usuario puede reclamar el cupón
            const canClaim = await CreditsCouponsService.canClaimCoupon(usuarioId, couponId);
            if (!canClaim.canClaim) {
                const statusCode = canClaim.reason?.includes('no encontrado') ? 404 : 400;
                res.status(statusCode).json({ 
                    success: false,
                    error: 'No se puede reclamar el cupón',
                    reason: canClaim.reason,
                    creditosNecesarios: canClaim.creditosNecesarios,
                    creditosActuales: canClaim.creditosActuales
                });
                return;
            }

            // Reclamar el cupón
            const result = await CreditsCouponsService.claimCoupon(usuarioId, couponId);

            res.status(200).json({
                success: true,
                message: 'Cupón reclamado exitosamente',
                data: {
                    claimedCoupon: result.claimedCoupon,
                    creditosRestantes: result.creditosRestantes,
                    codigoCanjeado: result.codigoCanjeado
                }
            });
        } catch (error) {
            console.error('Error in claimCoupon:', error);
            
            if (error instanceof Error) {
                // Manejar errores específicos
                if (error.message.includes('no encontrado')) {
                    res.status(404).json({ 
                        success: false,
                        error: 'Recurso no encontrado',
                        message: error.message
                    });
                    return;
                }

                if (error.message.includes('insuficientes') || 
                    error.message.includes('no está disponible') ||
                    error.message.includes('ha vencido') ||
                    error.message.includes('ya has reclamado')) {
                    res.status(400).json({ 
                        success: false,
                        error: 'No se puede procesar la solicitud',
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
     * Obtener cupones reclamados por un usuario
     * GET /users/:id/claimed-coupons
     */
    static async getUserClaimedCoupons(req: Request, res: Response): Promise<void> {
        try {
            const { id: usuarioId } = req.params;

            // Validar ID del usuario
            if (!usuarioId || usuarioId.trim() === '') {
                res.status(400).json({ 
                    success: false,
                    error: 'ID de usuario inválido' 
                });
                return;
            }

            const claimedCoupons = await CreditsCouponsService.getUserClaimedCoupons(usuarioId);

            res.status(200).json({
                success: true,
                data: claimedCoupons,
                count: claimedCoupons.length
            });
        } catch (error) {
            console.error('Error in getUserClaimedCoupons:', error);
            res.status(500).json({ 
                success: false,
                error: 'Error interno del servidor',
                message: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    /**
     * Obtener un cupón específico por ID
     * GET /coupons/:id
     */
    static async getCouponById(req: Request, res: Response): Promise<void> {
        try {
            const { id: couponId } = req.params;

            // Validar ID del cupón
            if (!couponId || couponId.trim() === '') {
                res.status(400).json({ 
                    success: false,
                    error: 'ID de cupón inválido' 
                });
                return;
            }

            const coupon = await CreditsCouponsService.getCouponById(couponId);

            if (!coupon) {
                res.status(404).json({ 
                    success: false,
                    error: 'Cupón no encontrado' 
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: coupon
            });
        } catch (error) {
            console.error('Error in getCouponById:', error);
            res.status(500).json({ 
                success: false,
                error: 'Error interno del servidor',
                message: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    /**
     * Obtener historial de créditos de un usuario
     * GET /users/:id/credit-history
     */
    static async getUserCreditHistory(req: Request, res: Response): Promise<void> {
        try {
            const { id: usuarioId } = req.params;

            // Validar ID del usuario
            if (!usuarioId || usuarioId.trim() === '') {
                res.status(400).json({ 
                    success: false,
                    error: 'ID de usuario inválido' 
                });
                return;
            }

            const creditHistory = await CreditsCouponsService.getUserCreditHistory(usuarioId);

            // Calcular estadísticas
            const totalGanados = creditHistory
                .filter(t => t.cantidad > 0)
                .reduce((sum, t) => sum + t.cantidad, 0);

            const totalGastados = Math.abs(creditHistory
                .filter(t => t.cantidad < 0)
                .reduce((sum, t) => sum + t.cantidad, 0));

            // Obtener créditos actuales
            const userCredits = await CreditsCouponsService.getUserCredits(usuarioId);

            res.status(200).json({
                success: true,
                data: {
                    transacciones: creditHistory,
                    creditosActuales: userCredits?.creditos || 0,
                    totalGanados,
                    totalGastados,
                    count: creditHistory.length
                }
            });
        } catch (error) {
            console.error('Error in getUserCreditHistory:', error);
            res.status(500).json({ 
                success: false,
                error: 'Error interno del servidor',
                message: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    /**
     * Verificar si un usuario puede reclamar un cupón
     * GET /users/:userId/can-claim/:couponId
     */
    static async canClaimCoupon(req: Request, res: Response): Promise<void> {
        try {
            const { userId: usuarioId, couponId } = req.params;

            // Validar IDs
            if (!usuarioId || usuarioId.trim() === '') {
                res.status(400).json({ 
                    success: false,
                    error: 'ID de usuario inválido' 
                });
                return;
            }

            if (!couponId || couponId.trim() === '') {
                res.status(400).json({ 
                    success: false,
                    error: 'ID de cupón inválido' 
                });
                return;
            }

            const result = await CreditsCouponsService.canClaimCoupon(usuarioId, couponId);

            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('Error in canClaimCoupon:', error);
            res.status(500).json({ 
                success: false,
                error: 'Error interno del servidor',
                message: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    }

    /**
     * Validar datos para reclamar un cupón
     */
    private static validateClaimCouponData(data: any): string | null {
        if (!data) {
            return 'Los datos son requeridos';
        }

        if (!data.couponId || typeof data.couponId !== 'string' || data.couponId.trim() === '') {
            return 'El ID del cupón es requerido y debe ser una cadena válida';
        }

        return null;
    }
}
