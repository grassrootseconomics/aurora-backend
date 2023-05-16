import { prisma } from '@/db';
import { Department } from '@prisma/client';

/**
 *
 * Fetches every Department from the Department Table.
 *
 * @returns {Promise<Department[]>}
 */
export const getAllDepartments = (): Promise<Department[]> => {
    return prisma.department.findMany();
};

/**
 *
 * Fetches a single Department Record by its Id from the Department Table.
 *
 * @param {number} id Id of the Department.
 * @returns {Promise<Department | null>}
 */
export const getDepartmentById = (id: number): Promise<Department | null> => {
    return prisma.department.findUnique({ where: { id } });
};
