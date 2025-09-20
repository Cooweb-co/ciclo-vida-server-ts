// src/types/recycler.types.ts

export interface IZonaCobertura {
    lat: number;
    lng: number;
    radio: number; // Radio en metros
}

export interface IInfoBase {
    nombre: string;
    telefono: string;
    email?: string;
    descripcion?: string;
    tiposResiduos?: string[]; // Tipos de residuos que maneja
    horarioAtencion?: string;
    sitioWeb?: string;
}

export interface IRecycler {
    id: string; // UID del reciclador
    zonasCobertura: IZonaCobertura[];
    infoBase: IInfoBase;
    fechaCreacion: Date;
    fechaActualizacion: Date;
    activo: boolean;
}

export interface ICreateRecyclerRequest {
    id: string; // UID proporcionado
    zonasCobertura: IZonaCobertura[];
    infoBase: IInfoBase;
}

export interface IUpdateRecyclerRequest {
    zonasCobertura?: IZonaCobertura[];
    infoBase?: Partial<IInfoBase>;
    activo?: boolean;
}

export interface IRecyclerResponse {
    success: boolean;
    data?: IRecycler;
    message?: string;
}

export interface IRecyclersListResponse {
    success: boolean;
    data?: IRecycler[];
    message?: string;
}
