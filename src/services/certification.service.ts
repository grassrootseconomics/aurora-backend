import { prisma } from '@/db';
import { Certification } from '@prisma/client';

import { BaseCertification } from '@/utils/types/certification';

/**
 *
 * Get certification by data fingerprint.
 *
 * @param {string} fingerprint Data Fingerprint.
 * @returns
 */
export const getCertificationByFingerprint = (fingerprint: string) => {
    return prisma.certification.findUnique({
        where: {
            dataFingerprint: fingerprint,
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
    certification: BaseCertification | Certification
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
};

/**
 *
 * Update a certification with signed details.
 *
 * @param {string} dataFingerprint Data fingerprint of the certification.
 * @param {SignActionFields} signedData New Signed Details.
 * @returns
 */
export const updateCertificationWithSignedData = (
    dataFingerprint: string,
    { signedDataFingerprint, dateSigned }: SignActionFields
) => {
    return prisma.certification.update({
        where: {
            dataFingerprint,
        },
        data: {
            signedDataFingerprint,
            dateSigned,
        },
    });
};
