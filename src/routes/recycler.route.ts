// src/routes/recycler.route.ts
import { Router } from 'express';
import { RecyclerController } from '../controllers/recycler.controller';

const router = Router();

/**
 * @route GET /recyclers/search/location
 * @desc Buscar recicladores por ubicación
 * @access Public
 * @query {number} lat - Latitud
 * @query {number} lng - Longitud
 * @query {number} maxDistance - Distancia máxima en metros (opcional, default: 5000)
 */
router.get('/recyclers/search/location', RecyclerController.findRecyclersByLocation);

/**
 * @route GET /recyclers
 * @desc Obtener todos los recicladores activos
 * @access Public
 */
router.get('/recyclers', RecyclerController.getAllActiveRecyclers);

/**
 * @route POST /recyclers
 * @desc Crear un nuevo reciclador
 * @access Public
 * @body {ICreateRecyclerRequest} - Datos del reciclador
 */
router.post('/recyclers', RecyclerController.createRecycler);

/**
 * @route GET /recyclers/:id
 * @desc Obtener un reciclador por ID
 * @access Public
 * @param {string} id - ID del reciclador
 */
router.get('/recyclers/:id', RecyclerController.getRecyclerById);

/**
 * @route PUT /recyclers/:id
 * @desc Actualizar un reciclador (perfil y zonas de cobertura)
 * @access Public
 * @param {string} id - ID del reciclador
 * @body {IUpdateRecyclerRequest} - Datos a actualizar
 */
router.put('/recyclers/:id', RecyclerController.updateRecycler);

/**
 * @route DELETE /recyclers/:id
 * @desc Eliminar un reciclador
 * @access Public
 * @param {string} id - ID del reciclador
 */
router.delete('/recyclers/:id', RecyclerController.deleteRecycler);

export default router;
