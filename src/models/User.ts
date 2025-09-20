// src/models/User.ts
import { IUser } from '../types/user.types';

// In-memory data store (in a real app, this would be a database)
const users: IUser[] = [];

export class UserModel {
    static async findAll(): Promise<IUser[]> {
        return [...users];
    }

    static async findById(id: string): Promise<IUser | undefined> {
        return users.find(user => user.id === id);
    }

    static async create(userData: Omit<IUser, 'description' | 'createdAt' | 'updatedAt'>): Promise<IUser> {
        const now = new Date();
        const newUser: IUser = {
            ...userData,
            id: Math.random().toString(36).substring(2, 9),
            createdAt: now,
            updatedAt: now,
        };

        users.push(newUser);
        return newUser;
    }

    static async update(id: string, userData: Partial<IUser>): Promise<IUser | null> {
        const index = users.findIndex(user => user.id === id);

        if (index === -1) return null;

        const updatedUser = {
            ...users[index],
            ...userData,
            updatedAt: new Date(),
        };

        users[index] = updatedUser;
        return updatedUser;
    }

    static async delete(id: string): Promise<boolean> {
        const initialLength = users.length;
        const filteredUsers = users.filter(user => user.id !== id);

        if (filteredUsers.length === initialLength) return false;

        // In a real app, we would update the users array here
        // For this example, we'll just return the success status
        return true;
    }
}
