import Joi from 'joi';

import { DefaultValidation } from '../types/server';

export const addPulpSchema: DefaultValidation = {
    body: Joi.object({
        pulp: Joi.object({
            codeProducer: Joi.string().required(),
            codeBatch: Joi.optional(),
            collectionDate: Joi.date().iso().required(),
            quality: Joi.string().required(),
            status: Joi.string().required(),
            genetics: Joi.string().required(),
            totalPulpKg: Joi.number().required(),
            pricePerKg: Joi.number().required(),
            totalPrice: Joi.number().required(),
        }).required(),
    }),
};

export const updatePulpSchema: DefaultValidation = {
    params: Joi.object().keys({
        id: Joi.number().integer().min(1).required(),
    }),
    body: Joi.object({
        pulp: Joi.object({
            codeProducer: Joi.string().optional(),
            codeBatch: Joi.optional(),
            collectionDate: Joi.date().iso().optional(),
            quality: Joi.string().optional(),
            status: Joi.string().optional(),
            genetics: Joi.string().optional(),
            totalPulpKg: Joi.number().optional(),
            pricePerKg: Joi.number().optional(),
            totalPrice: Joi.number().optional(),
        }),
    }),
};
