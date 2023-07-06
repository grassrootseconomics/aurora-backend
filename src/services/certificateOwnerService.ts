import { prisma } from '@/db';
import { CertificateOwner } from '@prisma/client';

type CertificateOwnerParams = Omit<CertificateOwner, 'id'>;

export const getCertificateOwners = (certificationKey: string) => {
    return prisma.certificateOwner.findMany({
        where: {
            certificationKey,
        },
    });
};

export const getCertificateBySignedFingerprint = (
    signedDataFingerprint: string
) => {
    return prisma.certification.findUnique({
        where: {
            signedDataFingerprint,
        },
    });
};

/**
 *
 * Save a new Certificate NFT Owner.
 *
 * @param {CertificateOwnerParams} certificateOwnerParams New Certificate Owner Params.
 * @returns
 */
export const saveNFTCertificateOwnership = (
    certificateOwnerParams: CertificateOwnerParams
) => {
    return prisma.certificateOwner.create({
        data: certificateOwnerParams,
    });
};
