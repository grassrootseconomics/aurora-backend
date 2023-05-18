import { prisma } from '@/db';
import { FermentationFlip } from '@prisma/client';

import { Flip } from '@/utils/types/fermentation/Flip';

/**
 *
 * Adds a Flip to the Fermentation Model.
 *
 * @param {Flip} flip New Flip Data.
 * @returns {Promise<FermentationFlip>} Newly Created Fermentation Flip
 */
export const addFlip = async (flip: Flip): Promise<FermentationFlip> => {
    const result = await prisma.fermentationFlip.create({
        data: flip,
    });

    return result;
};

/**
 *
 * Removes a Fermentation Model Flip by its Id.
 *
 * @param id Id of the Fermentation Flip.
 * @returns {Promise<FermentationFlip | null>}
 */
export const removeFlipById = (
    id: number
): Promise<FermentationFlip | null> => {
    return prisma.fermentationFlip.delete({ where: { id } });
};
