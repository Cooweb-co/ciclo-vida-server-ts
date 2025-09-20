// src/types/user.types.ts

export interface IUser {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    coordinates?: {
        lat: number;
        lng: number;
    };
    avatar?: string;
    creditos: number;
    fechaCreacion: Date;
    fechaActualizacion: Date;
    activo: boolean;
}

export interface ICreateUserRequest {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    coordinates?: {
        lat: number;
        lng: number;
    };
    avatar?: string;
}

export interface IUpdateUserRequest {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    coordinates?: {
        lat: number;
        lng: number;
    };
    avatar?: string;
    activo?: boolean;
}

export interface IUserResponse {
    success: boolean;
    data?: IUser;
    message?: string;
}

export interface IUsersListResponse {
    success: boolean;
    data?: IUser[];
    message?: string;
}

// Interfaces para consultas por usuario
export interface IUserAppointmentsResponse {
    success: boolean;
    data?: any[];
    count?: number;
    message?: string;
}

export interface IUserReviewsResponse {
    success: boolean;
    data?: any[];
    count?: number;
    message?: string;
}
