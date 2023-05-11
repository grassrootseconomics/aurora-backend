import { User } from '@prisma/client';
import { prisma } from '../db';

export const getAllUsers = (): Promise<User[]> => {
    return prisma.user.findMany();
};
