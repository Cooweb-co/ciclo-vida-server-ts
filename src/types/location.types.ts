// src/types/location.types.ts

export enum TipoLocation {
    BASURERO = 'basurero',
    CHATARRERIA = 'chatarreria',
    CENTRO_RECICLAJE = 'centro_reciclaje',
    PUNTO_LIMPIO = 'punto_limpio',
    CONTENEDOR = 'contenedor',
    OTRO = 'otro'
}

export interface ILocation {
    id: string;
    nombre: string;
    lat: number;
    lng: number;
    tipo: TipoLocation;
    fechaCreacion: Date;
    fechaActualizacion: Date;
    activo: boolean;
}

export interface ICreateLocationRequest {
    nombre: string;
    lat: number;
    lng: number;
    tipo: TipoLocation;
}

export interface ILocationResponse {
    success: boolean;
    data?: ILocation;
    message?: string;
}

export interface ILocationsListResponse {
    success: boolean;
    data?: ILocation[];
    count?: number;
    message?: string;
}

export interface IValidateLocationQuery {
    lat: number;
    lng: number;
    radio?: number; // Radio en metros para validación (default: 100m)
}

export interface IValidateLocationResponse {
    success: boolean;
    data: {
        isValid: boolean;
        nearbyLocations: ILocation[];
        closestLocation?: ILocation;
        distance?: number; // Distancia al punto más cercano en metros
    };
    message?: string;
}
