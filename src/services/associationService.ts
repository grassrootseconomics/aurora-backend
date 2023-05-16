import { prisma } from '@/db';
import { Association } from '@prisma/client';

/**
 *
 * Fetches every Association from the Association Table.
 *
 * @returns {Promise<Association[]>}
 */
export const getAllAssociations = (): Promise<Association[]> => {
    return prisma.association.findMany();
};

/**
 *
 * Fetches a single Association Record by its Id from the Association Table.
 *
 * @param {number} id Id of the Association.
 * @returns {Promise<Association | null>}
 */
export const getAssociationById = (id: number): Promise<Association | null> => {
    return prisma.association.findUnique({ where: { id } });
};
