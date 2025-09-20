import { Request, Response } from 'express';
import {
    createUser,
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    getUserAppointments,
    getUserReviews
} from '../models/User';
import { ICreateUserRequest, IUpdateUserRequest } from '../types/user.types';

/**
 * Crear un nuevo usuario
 * POST /api/users
 */
export const createUserHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const userData = req.body as ICreateUserRequest;

        // Validaciones básicas
        if (!userData.name || !userData.email) {
            res.status(400).json({
                success: false,
                error: 'Datos requeridos faltantes',
                message: 'El nombre y email son requeridos'
            });
            return;
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userData.email)) {
            res.status(400).json({
                success: false,
                error: 'Email inválido',
                message: 'El formato del email no es válido'
            });
            return;
        }

        const newUser = await createUser(userData);

        res.status(201).json({
            success: true,
            message: 'Usuario creado exitosamente',
            data: {
                id: newUser.id,
                ...userData,
                creditos: 0,
                activo: true
            }
        });
    } catch (error: any) {
        console.error('Error in createUserHandler:', error);
        
        if (error.message.includes('Ya existe un usuario')) {
            res.status(409).json({
                success: false,
                error: 'Usuario duplicado',
                message: error.message
            });
            return;
        }

        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: error.message || 'No se pudo crear el usuario'
        });
    }
};

/**
 * Obtener todos los usuarios
 * GET /api/users
 */
export const getUsersHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const users = await getUsers();

        res.status(200).json({
            success: true,
            data: users,
            count: users.length
        });
    } catch (error: any) {
        console.error('Error in getUsersHandler:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: 'No se pudieron obtener los usuarios'
        });
    }
};

/**
 * Obtener un usuario por ID
 * GET /api/users/:id
 */
export const getUserByIdHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        if (!id || id.trim() === '') {
            res.status(400).json({
                success: false,
                error: 'ID requerido',
                message: 'El ID del usuario es requerido'
            });
            return;
        }

        const user = await getUserById(id);

        if (!user) {
            res.status(404).json({
                success: false,
                error: 'Usuario no encontrado',
                message: 'No existe un usuario con el ID proporcionado'
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error: any) {
        console.error('Error in getUserByIdHandler:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: 'No se pudo obtener el usuario'
        });
    }
};

/**
 * Actualizar un usuario
 * PUT /api/users/:id
 */
export const updateUserHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userData = req.body as IUpdateUserRequest;

        if (!id || id.trim() === '') {
            res.status(400).json({
                success: false,
                error: 'ID requerido',
                message: 'El ID del usuario es requerido'
            });
            return;
        }

        // Verificar que el usuario existe
        const existingUser = await getUserById(id);
        if (!existingUser) {
            res.status(404).json({
                success: false,
                error: 'Usuario no encontrado',
                message: 'No existe un usuario con el ID proporcionado'
            });
            return;
        }

        // Validar email si se proporciona
        if (userData.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(userData.email)) {
                res.status(400).json({
                    success: false,
                    error: 'Email inválido',
                    message: 'El formato del email no es válido'
                });
                return;
            }
        }

        await updateUser(id, userData);

        // Obtener el usuario actualizado
        const updatedUser = await getUserById(id);

        res.status(200).json({
            success: true,
            message: 'Usuario actualizado exitosamente',
            data: updatedUser
        });
    } catch (error: any) {
        console.error('Error in updateUserHandler:', error);
        
        if (error.message.includes('Ya existe otro usuario')) {
            res.status(409).json({
                success: false,
                error: 'Email duplicado',
                message: error.message
            });
            return;
        }

        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: error.message || 'No se pudo actualizar el usuario'
        });
    }
};

/**
 * Eliminar un usuario
 * DELETE /api/users/:id
 */
export const deleteUserHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        if (!id || id.trim() === '') {
            res.status(400).json({
                success: false,
                error: 'ID requerido',
                message: 'El ID del usuario es requerido'
            });
            return;
        }

        // Verificar que el usuario existe
        const existingUser = await getUserById(id);
        if (!existingUser) {
            res.status(404).json({
                success: false,
                error: 'Usuario no encontrado',
                message: 'No existe un usuario con el ID proporcionado'
            });
            return;
        }

        await deleteUser(id);

        res.status(200).json({
            success: true,
            message: 'Usuario eliminado exitosamente'
        });
    } catch (error: any) {
        console.error('Error in deleteUserHandler:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: 'No se pudo eliminar el usuario'
        });
    }
};

/**
 * Obtener citas de un usuario
 * GET /api/users/:id/appointments
 */
export const getUserAppointmentsHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        if (!id || id.trim() === '') {
            res.status(400).json({
                success: false,
                error: 'ID requerido',
                message: 'El ID del usuario es requerido'
            });
            return;
        }

        // Verificar que el usuario existe
        const user = await getUserById(id);
        if (!user) {
            res.status(404).json({
                success: false,
                error: 'Usuario no encontrado',
                message: 'No existe un usuario con el ID proporcionado'
            });
            return;
        }

        const appointments = await getUserAppointments(id);

        res.status(200).json({
            success: true,
            data: appointments,
            count: appointments.length,
            message: `Citas encontradas para el usuario ${user.name}`
        });
    } catch (error: any) {
        console.error('Error in getUserAppointmentsHandler:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: 'No se pudieron obtener las citas del usuario'
        });
    }
};

/**
 * Obtener reseñas creadas por un usuario
 * GET /api/users/:id/reviews
 */
export const getUserReviewsHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        if (!id || id.trim() === '') {
            res.status(400).json({
                success: false,
                error: 'ID requerido',
                message: 'El ID del usuario es requerido'
            });
            return;
        }

        // Verificar que el usuario existe
        const user = await getUserById(id);
        if (!user) {
            res.status(404).json({
                success: false,
                error: 'Usuario no encontrado',
                message: 'No existe un usuario con el ID proporcionado'
            });
            return;
        }

        const reviews = await getUserReviews(id);

        res.status(200).json({
            success: true,
            data: reviews,
            count: reviews.length,
            message: `Reseñas encontradas del usuario ${user.name}`
        });
    } catch (error: any) {
        console.error('Error in getUserReviewsHandler:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: 'No se pudieron obtener las reseñas del usuario'
        });
    }
};