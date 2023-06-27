import Joi from 'joi';

import { DefaultValidation } from '../types/server';

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
