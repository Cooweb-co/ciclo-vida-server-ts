import { Router } from 'express';
import {
    createUserHandler,
    getUsersHandler,
    getUserByIdHandler,
    updateUserHandler,
    deleteUserHandler,
    getUserAppointmentsHandler,
    getUserReviewsHandler
} from '../controllers/user.controller';

const router = Router();

/**
 * @route POST /api/users
 * @desc Crear un nuevo usuario
 * @access Public
 * @body {ICreateUserRequest} - Datos del usuario
 */
router.post('/', createUserHandler);

/**
 * @route GET /api/users
 * @desc Obtener todos los usuarios
 * @access Public
 */
router.get('/', getUsersHandler);

/**
 * @route GET /api/users/:id
 * @desc Obtener un usuario por ID
 * @access Public
 * @param {string} id - ID del usuario
 */
router.get('/:id', getUserByIdHandler);

/**
 * @route PUT /api/users/:id
 * @desc Actualizar un usuario
 * @access Public
 * @param {string} id - ID del usuario
 * @body {IUpdateUserRequest} - Datos a actualizar
 */
router.put('/:id', updateUserHandler);

/**
 * @route DELETE /api/users/:id
 * @desc Eliminar un usuario
 * @access Public
 * @param {string} id - ID del usuario
 */
router.delete('/:id', deleteUserHandler);

/**
 * @route GET /api/users/:id/appointments
 * @desc Obtener todas las citas de un usuario
 * @access Public
 * @param {string} id - ID del usuario
 */
router.get('/:id/appointments', getUserAppointmentsHandler);

/**
 * @route GET /api/users/:id/reviews
 * @desc Obtener todas las reseñas creadas por un usuario
 * @access Public
 * @param {string} id - ID del usuario
 */
router.get('/:id/reviews', getUserReviewsHandler);

export default router;
