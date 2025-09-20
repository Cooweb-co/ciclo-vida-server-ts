// src/routes/credits.route.ts
import { Router } from 'express';
import { CreditsController } from '../controllers/credits.controller';

const router = Router();

/**
 * @route GET /users/:id/credits
 * @desc Obtener créditos de un usuario
 * @access Public
 * @param {string} id - ID del usuario
 */
router.get('/users/:id/credits', CreditsController.getUserCredits);

/**
 * @route GET /coupons
 * @desc Listar todos los cupones activos
 * @access Public
 * @query {string} categoria - Filtrar por categoría (opcional)
 * @query {string} empresa - Filtrar por empresa (opcional)
 */
router.get('/coupons', CreditsController.getAllCoupons);

/**
 * @route POST /users/:id/claim-coupon
 * @desc Reclamar un cupón validando créditos suficientes
 * @access Public
 * @param {string} id - ID del usuario
 * @body {IClaimCouponRequest} - ID del cupón a reclamar
 */
router.post('/users/:id/claim-coupon', CreditsController.claimCoupon);

/**
 * @route GET /users/:id/claimed-coupons
 * @desc Obtener cupones reclamados por un usuario
 * @access Public
 * @param {string} id - ID del usuario
 */
router.get('/users/:id/claimed-coupons', CreditsController.getUserClaimedCoupons);

/**
 * @route GET /coupons/:id
 * @desc Obtener un cupón específico por ID
 * @access Public
 * @param {string} id - ID del cupón
 */
router.get('/coupons/:id', CreditsController.getCouponById);

/**
 * @route GET /users/:id/credit-history
 * @desc Obtener historial de transacciones de créditos de un usuario
 * @access Public
 * @param {string} id - ID del usuario
 */
router.get('/users/:id/credit-history', CreditsController.getUserCreditHistory);

/**
 * @route GET /users/:userId/can-claim/:couponId
 * @desc Verificar si un usuario puede reclamar un cupón específico
 * @access Public
 * @param {string} userId - ID del usuario
 * @param {string} couponId - ID del cupón
 */
router.get('/users/:userId/can-claim/:couponId', CreditsController.canClaimCoupon);

export default router;
