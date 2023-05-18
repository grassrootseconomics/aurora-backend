import { prisma } from '@/db';
import { Pulp } from '@prisma/client';

import { PulpUpdate } from '@/utils/types/batch';

/**
 *
 * Fetches existing pulps by their producer's code.
 *
 * @param {string} code Producer Code.
 * @returns {Promise<Pulp[]>}
 */
export const getPulpsByProducerCode = (code: string): Promise<Pulp[]> => {
    return prisma.pulp.findMany({ where: { codeProducer: code } });
};
