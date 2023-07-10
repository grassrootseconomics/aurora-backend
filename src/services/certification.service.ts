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
 * Fetches the latest certification of a batch
 *
 * @param {string} code Code of the Batch.
 * @returns
 */
export const getLatestSignedCertificationForBatch = (code: string) => {
    return prisma.certification.findFirst({
        where: {
            codeBatch: code,
        },
        orderBy: {
            dateSigned: 'desc',
        },
        take: 1,
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
