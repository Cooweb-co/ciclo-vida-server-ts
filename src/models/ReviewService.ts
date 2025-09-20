// src/models/ReviewService.ts
import { 
    collection, 
    addDoc, 
    query, 
    where, 
    orderBy, 
    limit, 
    startAfter, 
    getDocs, 
    doc,
    Timestamp,
    DocumentSnapshot
} from 'firebase/firestore';
import { db } from './FirebaseService';
import { IReview, ICreateReviewRequest, IReviewsResponse } from '../types/review.types';

export class ReviewService {
    private static readonly COLLECTION_NAME = 'reviews';

    /**
     * Crear una nueva reseña para un reciclador
     */
    static async createReview(recicladorId: string, reviewData: ICreateReviewRequest): Promise<IReview> {
        try {
            const reviewsCollection = collection(db, this.COLLECTION_NAME);
            
            const newReview = {
                recicladorId,
                usuarioId: reviewData.usuarioId,
                rating: reviewData.rating,
                comentario: reviewData.comentario,
                fecha: Timestamp.now()
            };

            const docRef = await addDoc(reviewsCollection, newReview);
            
            return {
                id: docRef.id,
                recicladorId,
                usuarioId: reviewData.usuarioId,
                rating: reviewData.rating,
                comentario: reviewData.comentario,
                fecha: newReview.fecha.toDate()
            };
        } catch (error) {
            console.error('Error creating review:', error);
            throw new Error('Error al crear la reseña');
        }
    }

    /**
     * Obtener reseñas de un reciclador con paginación
     */
    static async getReviewsByRecyclerId(
        recicladorId: string, 
        limitCount: number = 10, 
        startAfterDoc?: string
    ): Promise<IReviewsResponse> {
        try {
            const reviewsCollection = collection(db, this.COLLECTION_NAME);
            
            let reviewQuery = query(
                reviewsCollection,
                where('recicladorId', '==', recicladorId),
                orderBy('fecha', 'desc'),
                limit(limitCount + 1) // +1 para verificar si hay más documentos
            );

            // Si hay un documento de inicio, agregarlo a la consulta
            if (startAfterDoc) {
                const startAfterSnapshot = await this.getDocumentSnapshot(startAfterDoc);
                if (startAfterSnapshot.exists()) {
                    reviewQuery = query(
                        reviewsCollection,
                        where('recicladorId', '==', recicladorId),
                        orderBy('fecha', 'desc'),
                        startAfter(startAfterSnapshot),
                        limit(limitCount + 1)
                    );
                }
            }

            const querySnapshot = await getDocs(reviewQuery);
            const reviews: IReview[] = [];
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                reviews.push({
                    id: doc.id,
                    recicladorId: data.recicladorId,
                    usuarioId: data.usuarioId,
                    rating: data.rating,
                    comentario: data.comentario,
                    fecha: data.fecha.toDate()
                });
            });

            // Verificar si hay más documentos
            const hasMore = reviews.length > limitCount;
            if (hasMore) {
                reviews.pop(); // Remover el documento extra
            }

            // Obtener el ID del último documento para la siguiente página
            const lastDoc = reviews.length > 0 ? reviews[reviews.length - 1].id : undefined;

            return {
                reviews,
                hasMore,
                lastDoc
            };
        } catch (error) {
            console.error('Error getting reviews:', error);
            throw new Error('Error al obtener las reseñas');
        }
    }

    /**
     * Obtener un snapshot de documento por ID
     */
    private static async getDocumentSnapshot(docId: string): Promise<DocumentSnapshot> {
        const docRef = doc(db, this.COLLECTION_NAME, docId);
        const docQuery = query(collection(db, this.COLLECTION_NAME), where('__name__', '==', docId));
        const docSnap = await getDocs(docQuery);
        return docSnap.docs[0];
    }

    /**
     * Calcular el rating promedio de un reciclador
     */
    static async getAverageRating(recicladorId: string): Promise<{ average: number; count: number }> {
        try {
            const reviewsCollection = collection(db, this.COLLECTION_NAME);
            const reviewQuery = query(
                reviewsCollection,
                where('recicladorId', '==', recicladorId)
            );

            const querySnapshot = await getDocs(reviewQuery);
            
            if (querySnapshot.empty) {
                return { average: 0, count: 0 };
            }

            let totalRating = 0;
            let count = 0;

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                totalRating += data.rating;
                count++;
            });

            const average = totalRating / count;

            return {
                average: Math.round(average * 100) / 100, // Redondear a 2 decimales
                count
            };
        } catch (error) {
            console.error('Error calculating average rating:', error);
            throw new Error('Error al calcular el rating promedio');
        }
    }
}
