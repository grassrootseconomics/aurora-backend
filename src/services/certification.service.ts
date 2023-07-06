import { prisma } from '@/db';
import { Certification } from '@prisma/client';

/**
 *
 * Get a certificatino by its key.
 *
 * @param {string} key Certification Key.
 * @returns
 */
export const getCertificationByKey = (key: string) => {
    return prisma.certification.findUnique({
        where: {
            key,
        },
    });
};

/**
 *
 * Create a new Certification
 *
 * @param {BaseCertification | Certification} certification Required and Optional Certification Data.
 * @returns
 */
export const createCertification = (
    certification: Omit<Certification, 'id'>
) => {
    return prisma.certification.create({
        data: {
            ...certification,
        },
    });
};

type SignActionFields = {
    signedDataFingerprint: string;
    dateSigned: Date;
    signerWallet: string;
    key: string;
};
