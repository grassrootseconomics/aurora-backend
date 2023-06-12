import { prisma } from '@/db';
import { Pulp } from '@prisma/client';

import { AddPulp, UpdatePulp } from '@/utils/types/pulp';

/**
 *
 * Fetch a pulp by its Id.
 *
 * @param {number} id Id of Pulp.
 * @returns
 */
export const getPulpById = (id: number) => {
    return prisma.pulp.findUnique({
        where: {
            id,
        },
        include: {
            batchesUsedFor: true,
        },
    });
};

/**
 *
 * Fetches existing pulps by their producer's code.
 *
 * @param {string} code Producer Code.
 * @returns {Promise<Pulp[]>}
 */
export const getPulpsByProducerCode = (code: string): Promise<Pulp[]> => {
    return prisma.pulp.findMany({
        where: { codeProducer: code },
        include: { batchesUsedFor: true },
    });
};

/**
 *
 * Creates a Pulp and optional links to batches.
 *
 * @param newPulp New Pulp Details.
 * @returns New Pulp Details with Batch Link.
 */
export const addPulp = (newPulp: AddPulp) => {
    const {
        codeProducer,
        codeBatch,
        collectionDate,
        quality,
        status,
        genetics,
        totalPrice,
        pricePerKg,
        totalPulpKg,
    } = newPulp;
    return prisma.pulp.create({
        data: {
            collectionDate,
            quality,
            status,
            genetics,
            totalPrice,
            pricePerKg,
            totalPulpKg,
            codeProducer,
            batchesUsedFor: codeBatch
                ? {
                      create: [
                          {
                              codeBatch: codeBatch,
                          },
                      ],
                  }
                : undefined,
        },
        include: {
            batchesUsedFor: true,
        },
    });
};

/**
 *
 * Updates a pulp by its id and its links to batches.
 *
 * If `codeBatch` is specified, it will update or create the link to batches.
 *
 * @param {number} id Id of the Pulp.
 * @param updatePulp New Pulp Details.
 * @returns New Pulp Details with Batch Link.
 */
export const updatePulpById = async (id: number, updatePulp: UpdatePulp) => {
    const {
        codeProducer,
        codeBatch,
        collectionDate,
        quality,
        status,
        genetics,
        totalPrice,
        pricePerKg,
        totalPulpKg,
    } = updatePulp;
    const pulp = await prisma.pulp.update({
        where: {
            id,
        },
        data: {
            codeProducer,
            collectionDate,
            quality,
            status,
            genetics,
            totalPrice,
            pricePerKg,
            totalPulpKg,
        },
        include: {
            batchesUsedFor: true,
        },
    });
    if (codeBatch) {
        const batchUsedFor = await prisma.pulpBatch.findFirst({
            where: {
                idPulp: pulp.id,
            },
        });
        if (batchUsedFor) {
            const updatedLink = await prisma.pulpBatch.update({
                where: {
                    id: batchUsedFor.id,
                },
                data: {
                    codeBatch,
                },
            });
            pulp.batchesUsedFor = [updatedLink];
        } else {
            const newLink = await prisma.pulpBatch.create({
                data: {
                    codeBatch,
                    idPulp: pulp.id,
                },
            });
            pulp.batchesUsedFor = [newLink];
        }
    } else {
        await prisma.pulpBatch.deleteMany({
            where: {
                idPulp: pulp.id,
            },
        });
        pulp.batchesUsedFor = [];
    }
    return pulp;
};

/**
 *
 * Removes a pulp by its Id and its links to batches.
 *
 * @param {number} id Id of the Pulp.
 * @returns
 */
export const removePulpById = (id: number) => {
    return prisma.pulp.delete({
        where: {
            id,
        },
        include: {
            batchesUsedFor: true,
        },
    });
};
