import Joi from 'joi';

import { DefaultValidation } from '../types/server';

export const getBatchCertificateNFTDetailsSchema: DefaultValidation = {
    params: Joi.object().keys({
        code: Joi.string().required(),
    }),
};

export const createBatchBaseCertificateSchema: DefaultValidation = {
    params: Joi.object().keys({
        code: Joi.string().required(),
    }),
};

export const saveBatchSignedCertificationSchema: DefaultValidation = {
    params: Joi.object().keys({
        code: Joi.string().required(),
    }),
    body: Joi.object({
        fingerprints: Joi.object({
            dataFingerprint: Joi.string().required(),
            dateSigned: Joi.date().iso().required(),
            signedDataFingerprint: Joi.string().required(),
        }),
    }),
};

export const saveBatchNFTCertificationSchema: DefaultValidation = {
    params: Joi.object().keys({
        code: Joi.string().required(),
    }),
    body: Joi.object({
        mintDetails: Joi.object({
            minterWallet: Joi.string().required(),
            buyerWallet: Joi.string().required(),
            certificateKey: Joi.string().required(),
            tokenId: Joi.string().required(),
        }),
    }),
};
