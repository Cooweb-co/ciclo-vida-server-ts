// src/types/review.types.ts

export interface IReview {
    id: string;
    recicladorId: string;
    usuarioId: string;
    rating: number; // 1-5
    comentario: string;
    fecha: Date;
}

export interface ICreateReviewRequest {
    usuarioId: string;
    rating: number;
    comentario: string;
}

export interface IReviewsResponse {
    reviews: IReview[];
    hasMore: boolean;
    lastDoc?: string;
}

export interface IPaginationQuery {
    limit?: number;
    startAfter?: string;
}
