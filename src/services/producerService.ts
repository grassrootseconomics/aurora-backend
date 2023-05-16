import { prisma } from '@/db';
import { Producer } from '@prisma/client';

import { ProducerUpdate } from '@/utils/types/producer';
import { ISearchParameters, ISearchResult } from '@/utils/types/server';

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
 * Searches, paginates and filters producers by name.
 *
 * @param {ISearchParameters} options Search Filters.
 * @returns {Promise<ISearchResult<Producer>>}
 */
export const searchProducers = async ({
    search = '',
    index = 0,
    limit = 10,
}: ISearchParameters): Promise<ISearchResult<Producer>> => {
    const data = await prisma.producer.findMany({
        // I should switch this to a cursor approach.
        skip: index * limit,
        take: limit,
        where: {
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
    });

    const count = await prisma.producer.count({
        where: {
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
