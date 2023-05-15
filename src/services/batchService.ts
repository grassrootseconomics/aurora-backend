import { prisma } from '@/db';
import { Batch, FermentationPhase } from '@prisma/client';

import ISearchBatchParams from '@/utils/types/batch/ISearchBatchParams';
import { ISearchResult } from '@/utils/types/server';

/**
 *
 * Fetches batches by their sale status; Default to true.
 *
 * @param {boolean} sold If the batch was sold.
 * @returns {Promise<Batch[]>}
 */
export const getBatchesBySoldStatus = (
    sold: boolean = true
): Promise<Batch[]> => {
    return prisma.batch.findMany({
        where: sold ? { NOT: { sale: null } } : { sale: null },
        include: {
            sale: true,
            storage: true,
            fermentationPhase: {
                include: {
                    flips: true,
                },
            },
            pulpsUsed: {
                include: {
                    pulp: true,
                },
            },
            producersInvolved: true,
        },
    });
};

/**
 *
 * Fetches a batch by its code.
 *
 * @param {string} code Batch Code.
 * @returns {Promise<Batch | null>}
 */
export const getBatchByCode = (code: string): Promise<Batch | null> => {
    return prisma.batch.findUnique({
        where: { code },
        include: {
            sale: true,
            storage: true,
            fermentationPhase: {
                include: {
                    flips: true,
                },
            },
            pulpsUsed: {
                include: {
                    pulp: true,
                },
            },
            producersInvolved: true,
        },
    });
};

/**
 *
 * Fetches the Fermentation Model of a Batch.
 *
 * @param {string} code Batch Code.
 * @returns {Promise<FermentationPhase | null>}
 */
export const getBatchFermentationModelByCode = (
    code: string
): Promise<FermentationPhase | null> => {
    return prisma.fermentationPhase.findUnique({
        where: { codeBatch: code },
        include: { flips: true },
    });
};

/**
 *
 * Queries for Batches by their Producer Code.
 *
 * @param {string} code Producer Code.
 * @returns
 */
export const getBatchesByProducerCode = async (
    code: string
): Promise<Batch[]> => {
    const batchLinks = await prisma.producersBatch.findMany({
        where: { codeProducer: code },
        include: { batch: true },
    });

    return batchLinks.map((batchLink) => batchLink.batch);
};

/**
 *
 * Searches, paginates and filters batches by batch code and department.
 *
 * @param {ISearchBatchParams} options Search Filters.
 * @returns {Promise<ISearchResult<Batch>>}
 */
export const searchBatches = async ({
    search = '',
    index = 0,
    limit = 10,
    department = '',
}: ISearchBatchParams): Promise<ISearchResult<Batch>> => {
    const data = await prisma.batch.findMany({
        // I should switch this to a cursor approach.
        skip: index * limit,
        take: limit,
        where: {
            AND: [
                {
                    code: {
                        contains: search,
                    },
                },
                {
                    producersInvolved: {
                        some: {
                            producer: {
                                department: {
                                    name: {
                                        contains: department,
                                    },
                                },
                            },
                        },
                    },
                },
            ],
        },
        include: {
            sale: true,
            storage: true,
            fermentationPhase: {
                include: {
                    flips: true,
                },
            },
            pulpsUsed: {
                include: {
                    pulp: true,
                },
            },
            producersInvolved: {
                include: {
                    producer: {
                        include: {
                            department: true,
                        },
                    },
                },
            },
        },
    });

    const count = await prisma.batch.count({
        where: {
            code: {
                contains: search,
            },
        },
    });

    return {
        data,
        totalEntries: count,
        totalPages: Math.ceil(count / limit),
        page: index,
    };
};
