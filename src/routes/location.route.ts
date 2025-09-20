// src/routes/location.route.ts
import { Router } from 'express';
import { LocationController } from '../controllers/location.controller';

const router = Router();

/**
 * @route GET /locations/validate
 * @desc Validar si un punto está registrado o está dentro de un radio
 * @access Public
 * @query {number} lat - Latitud (requerido)
 * @query {number} lng - Longitud (requerido)
 * @query {number} radio - Radio en metros (opcional, default: 100)
 */
router.get('/locations/validate', LocationController.validateLocation);

/**
 * @route GET /locations/search/area
 * @desc Buscar ubicaciones dentro de un área específica
 * @access Public
 * @query {number} lat - Latitud del centro (requerido)
 * @query {number} lng - Longitud del centro (requerido)
 * @query {number} radius - Radio en metros (requerido)
 */
router.get('/locations/search/area', LocationController.getLocationsInArea);

/**
 * @route GET /locations
 * @desc Listar todas las ubicaciones activas
 * @access Public
 * @query {string} tipo - Filtrar por tipo de ubicación (opcional)
 */
router.get('/locations', LocationController.getAllLocations);

/**
 * @route POST /locations
 * @desc Registrar un nuevo punto de entrega
 * @access Public
 * @body {ICreateLocationRequest} - Datos de la ubicación
 */
router.post('/locations', LocationController.createLocation);

/**
 * @route GET /locations/:id
 * @desc Obtener una ubicación específica por ID
 * @access Public
 * @param {string} id - ID de la ubicación
 */
router.get('/locations/:id', LocationController.getLocationById);

/**
 * @route DELETE /locations/:id
 * @desc Eliminar un punto de entrega
 * @access Public
 * @param {string} id - ID de la ubicación
 */
router.delete('/locations/:id', LocationController.deleteLocation);

export default router;
