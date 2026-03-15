import { User } from "./user.model";
import type { IUser, UserResponse } from "./user.types";

class UserService {
    async findById(id: string): Promise<IUser | null> {
        return User.findById(id);
    }

    async findByEmail(email: string): Promise<IUser | null> {
        return User.findOne({ email: email.toLowerCase().trim() });
    }

    async createUser(data: {
        name: string;
        email: string;
        password: string;
        role?: "user" | "admin";
    }): Promise<IUser> {
        return User.create({
            name: data.name,
            email: data.email.toLowerCase().trim(),
            password: data.password,
            role: data.role || "user",
        });
    }

    async getAllUsers() {
        const users = await User.find().sort({ createdAt: -1 });
        return users.map((user: any) => ({
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString(),
        }));
    }

    async updateOnboardingData(userId: string, data: Partial<IUser>): Promise<IUser | null> {
        return User.findByIdAndUpdate(
            userId,
            {
                ...data,
                onboardingComplete: true,
            },
            { new: true },
        );
    }

    toResponse(user: IUser): UserResponse {
        return {
            id: (user as any)._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
        };
    }
}

export const userService = new UserService();
