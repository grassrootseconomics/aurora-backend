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

/**
 *
 * Updates and returns the Pulp of a Batch.
 *
 * @param {number} id Id of the Pulp.
 * @param {Partial<PulpUpdate>} pulpDetails New Pulp Details
 * @returns {Promise<Pulp>}
 */
export const updatePulp = async (
    id: number,
    pulpDetails: Partial<PulpUpdate>
): Promise<Pulp> => {
    return await prisma.pulp.update({
        where: { id },
        data: pulpDetails,
    });
};
