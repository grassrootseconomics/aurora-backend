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
    certification: BaseCertification | Certification
) => {
    return prisma.certification.create({
        data: {
            ...certification,
        },
    });
};

type MintActionFields = {
    minterWallet: string;
    buyerWallet: string;
    tokenId: string;
};

/**
 *
 * Update a certification with signed details.
 *
 * @param {string} key Access Key of the certification signature link.
 * @param {MintActionFields} mintedData New Minted Details.
 * @returns
 */
export const updateCertificationWithMintedData = (
    key: string,
    { minterWallet, buyerWallet, tokenId }: MintActionFields
) => {
    return prisma.certification.update({
        where: {
            key,
        },
        data: {
            minterWallet,
            buyerWallet,
            tokenId,
        },
    });
};

type SignActionFields = {
    signedDataFingerprint: string;
    dateSigned: Date;
    signerWallet: string;
    key: string;
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
    { signedDataFingerprint, dateSigned, signerWallet, key }: SignActionFields
) => {
    return prisma.certification.update({
        where: {
            dataFingerprint,
        },
        data: {
            signedDataFingerprint,
            signerWallet,
            dateSigned,
            key,
        },
    });
};

export const updateCertificationFingerprintByCode = (
    oldFingerprint: string,
    newFingerprint: string
) => {
    return prisma.certification.update({
        where: {
            dataFingerprint: oldFingerprint,
        },
        data: {
            dataFingerprint: newFingerprint,
        },
    });
};
