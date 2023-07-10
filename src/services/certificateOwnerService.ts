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

export const checkOwnerOfCertification = async (
    buyerWallet: string,
    certKey: string
) => {
    const certOwners = await prisma.certificateOwner.findMany({
        where: {
            buyerWallet,
            certificationKey: certKey,
        },
    });

    return certOwners.length > 0;
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
