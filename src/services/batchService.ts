import { prisma } from '@/db';
import {
    Batch,
    DryingPhase,
    FermentationPhase,
    Sale,
    Storage,
} from '@prisma/client';

import {
    DryingPhaseUpdate,
    FermentationPhaseUpdate,
    ISearchBatchParams,
    SalesPhaseUpdate,
    StoragePhaseUpdate,
} from '@/utils/types/batch';
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
                    pulp: {
                        include: {
                            producer: true,
                        },
                    },
                },
            },
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
                    pulp: {
                        include: {
                            producer: true,
                        },
                    },
                },
            },
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
 * Queries for Batches by a given collection of Pulp IDs.
 *
 *
 * @param {number[]} pulpIds Pulp Ids.
 * @returns {Promise<Batch[]>}
 */
export const getBatchesByPulpIds = async (
    pulpIds: number[]
): Promise<Batch[]> => {
    const pulpBatches = await prisma.pulpBatch.findMany({
        where: {
            idPulp: {
                in: pulpIds,
            },
        },
        include: {
            batch: {
                include: {
                    sale: true,
                    storage: true,
                    dryingPhase: true,
                    fermentationPhase: true,
                },
            },
        },
    });

    return pulpBatches.map((pulpBatch) => pulpBatch.batch);
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
                    pulpsUsed: {
                        some: {
                            pulp: {
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
                    pulp: {
                        include: {
                            producer: {
                                include: {
                                    department: true,
                                },
                            },
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

/**
 *
 * Updates and returns the Sales Phase Details of a Batch.
 *
 * @param {number} id Id of the Sales Phase.
 * @param {Partial<SalesPhase>} salesPhase New Sales Phase Details.
 * @returns {Promise<Sale>}
 */
export const updateBatchSalesPhase = async (
    id: number,
    salesPhase: Partial<SalesPhaseUpdate>
): Promise<Sale> => {
    return await prisma.sale.update({
        where: { id },
        data: salesPhase,
    });
};

/**
 *
 * Updates and returns the Storage Phase Details of a Batch.
 *
 * @param {number} id Id of the Storage Phase.
 * @param {Partial<StoragePhase>} storagePhase New Storage Details Phase
 * @returns {Promise<Storage>}
 */
export const updateBatchStoragePhase = async (
    id: number,
    storagePhase: Partial<StoragePhaseUpdate>
): Promise<Storage> => {
    return await prisma.storage.update({
        where: { id },
        data: storagePhase,
    });
};

/**
 *
 * Updates and returns the Drying Phase Details of a Batch.
 *
 * @param {number} id Id of the Drying Phase.
 * @param {Partial<DryingPhase>} dryingPhase New Drying Phase Details
 * @returns {Promise<DryingPhase>}
 */
export const updateBatchDryingPhase = async (
    id: number,
    dryingPhase: Partial<DryingPhaseUpdate>
): Promise<DryingPhase> => {
    return await prisma.dryingPhase.update({
        where: { id },
        data: dryingPhase,
    });
};

/**
 *
 * Updates and returns the Fermentation Phase Details of a Batch.
 *
 * @param {number} id Id of the Fermentation Phase.
 * @param {Partial<FermentationPhaseUpdate>} fermentationPhase New Fermentation Phase Details
 * @returns {Promise<FermentationPhase>}
 */
export const updateBatchFermentationPhase = async (
    id: number,
    fermentationPhase: Partial<FermentationPhaseUpdate>
): Promise<FermentationPhase> => {
    return await prisma.fermentationPhase.update({
        where: { id },
        data: fermentationPhase,
    });
};
