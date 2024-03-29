import { prisma } from '@/db';
import { Producer } from '@prisma/client';

import { ISearchProducerParams, ProducerUpdate } from '@/utils/types/producer';
import { ISearchResult } from '@/utils/types/server';

/**
 *
 * Fetch all base Producers.
 *
 * @returns {Promise<Producer[]>}
 */
export const getAllProducers = ({
    association = '',
    department = '',
}): Promise<Producer[]> => {
    return prisma.producer.findMany({
        where: {
            AND: [
                {
                    department: {
                        name: {
                            contains: department,
                        },
                    },
                },
                {
                    association: {
                        name: {
                            contains: association,
                        },
                    },
                },
            ],
        },
    });
};
/**
 *
 * Fetch all Producers with Sale & Storage Batch Data attached.
 *
 * @returns
 */
export const getProducersWithBatchData = () => {
    return prisma.producer.findMany({
        include: {
            producedPulps: {
                include: {
                    batchesUsedFor: {
                        include: {
                            batch: {
                                include: {
                                    sale: true,
                                    storage: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });
};

/**
 *
 * Fetches a producer by its code.
 *
 * @param {string} code Producer Code.
 * @returns {Promise<Producer | null>}
 */
export const getProducerByCode = (code: string): Promise<Producer | null> => {
    return prisma.producer.findUnique({ where: { code } });
};

/**
 *
 * Checks if a producer with the given code exists.
 *
 * @param {string} code Producer Code to filter for.
 * @returns {Promise<boolean>}
 */
export const checkProducerExistsByCode = async (
    code: string
): Promise<boolean> => {
    const producer = await prisma.producer.findUnique({ where: { code } });

    return producer !== null;
};

/**
 *
 * Searches, paginates and filters producers by name.
 *
 * @param {ISearchParameters} options Search Filters.
 * @returns {Promise<ISearchResult<Producer>>}
 */
export const searchProducers = async ({
    search = '',
    index = 0,
    limit = 10,
    filterField = 'association',
    filterValue = '',
}: ISearchProducerParams): Promise<ISearchResult<Producer>> => {
    const data = await prisma.producer.findMany({
        // I should switch this to a cursor approach.
        skip: index * limit,
        take: limit,
        where: {
            AND: [
                {
                    OR: [
                        {
                            firstName: {
                                contains: search,
                            },
                        },
                        {
                            lastName: {
                                contains: search,
                            },
                        },
                    ],
                },
                {
                    [filterField]: {
                        name: {
                            contains: filterValue,
                        },
                    },
                },
            ],
        },
    });

    const count = await prisma.producer.count({
        where: {
            AND: [
                {
                    OR: [
                        {
                            firstName: {
                                contains: search,
                            },
                        },
                        {
                            lastName: {
                                contains: search,
                            },
                        },
                    ],
                },
                {
                    [filterField]: {
                        name: {
                            contains: filterValue,
                        },
                    },
                },
            ],
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
 * Updates and returns the Details of a Producer.
 *
 * @param {string} code Unique Code of Producer.
 * @param {Partial<ProducerUpdate>} producerDetails New Producer Details
 * @returns {Promise<FermentationPhase>}
 */
export const updateProducerByCode = async (
    code: string,
    producerDetails: Partial<ProducerUpdate>
): Promise<Producer> => {
    return await prisma.producer.update({
        where: { code },
        data: producerDetails,
    });
};

/**
 *
 * Removes links between `Producer Pulps` and a `Batch`.
 *
 * @param {string} codeProducer Code of the Producer.
 * @param {string} codeBatch Code of the Batch.
 * @returns {Promise<boolean>} `True` on a success; `False` otherwise.
 */
export const unlinkProducerFromBatch = async (
    codeProducer: string,
    codeBatch: string
): Promise<boolean> => {
    const response = await prisma.pulpBatch.deleteMany({
        where: {
            AND: [
                {
                    pulp: {
                        codeProducer,
                    },
                },
                {
                    codeBatch,
                },
            ],
        },
    });
    return response.count > 0;
};

/**
 *
 * Checks whether a Producer has Pulps linked to a Batch.
 *
 * @param {string} codeProducer Code of the Producer.
 * @param {string} codeBatch Code of the Batch.
 * @returns {Promise<boolean>} `True` on a success; `False` otherwise.
 */
export const checkProducerLinkedToBatch = async (
    codeProducer: string,
    codeBatch: string
): Promise<boolean> => {
    const response = await prisma.pulpBatch.count({
        where: {
            AND: [
                {
                    codeBatch,
                },
                {
                    pulp: {
                        codeProducer,
                    },
                },
            ],
        },
    });
    return response > 0;
};

/**
 *
 * Creates links between unlinked `Producer Pulps` and a `Batch`.
 *
 * @param {string} codeProducer Code of the Producer.
 * @param {string} codeBatch Code of the Batch.
 * @returns {Promise<boolean>} `True` on a success; `False` otherwise.
 */
export const linkProducerToBatch = async (
    codeProducer: string,
    codeBatch: string
): Promise<boolean> => {
    const pulps = await prisma.pulp.findMany({
        where: {
            AND: [
                {
                    codeProducer,
                },
                {
                    batchesUsedFor: {
                        none: {},
                    },
                },
            ],
        },
        include: {
            batchesUsedFor: true,
        },
    });

    const newPulpBatches = pulps.map((pulp) => {
        return {
            codeBatch,
            idPulp: pulp.id,
        };
    });

    const result = await prisma.pulpBatch.createMany({
        data: newPulpBatches,
        skipDuplicates: true,
    });

    return result.count > 0;
};
