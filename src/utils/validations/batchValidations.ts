import Joi from 'joi';

import { DefaultValidation } from '../types/server';

export const updateBatchSalesSchema: DefaultValidation = {
    params: Joi.object().keys({
        id: Joi.number().integer().min(1).required(),
    }),
    body: Joi.object({
        sale: Joi.object({
            id: Joi.forbidden(),
            codeBatch: Joi.forbidden(),
            buyer: Joi.string().optional(),
            lotCode: Joi.string().optional(),
            negotiation: Joi.string().optional(),
            negotiationTerm: Joi.string().optional(),
            negotiationDate: Joi.date().iso().optional(),
            destination: Joi.string().optional(),
            currency: Joi.string().optional(),
            pricePerKg: Joi.number().optional(),
            totalValue: Joi.number().optional(),
        }),
    }),
};

export const updateBatchStorageSchema: DefaultValidation = {
    params: Joi.object().keys({
        id: Joi.number().integer().min(1).required(),
    }),
    body: Joi.object({
        storage: Joi.object({
            id: Joi.forbidden(),
            codeBatch: Joi.forbidden(),
            dayEntry: Joi.date().iso().optional(),
            netWeight: Joi.number().optional(),
            conversionFaction: Joi.number().optional(),
            fermentationPercentage: Joi.number().optional(),
            grainIndex: Joi.number().optional(),
            sensoryProfile: Joi.string().optional(),
            score: Joi.number().optional(),
        }),
    }),
};

export const updateBatchDryingSchema: DefaultValidation = {
    params: Joi.object().keys({
        id: Joi.number().integer().min(1).required(),
    }),
    body: Joi.object({
        drying: Joi.object({
            id: Joi.forbidden(),
            codeBatch: Joi.forbidden(),
            startDate: Joi.date().iso().optional(),
            endDate: Joi.date().iso().optional(),
            totalDryingDays: Joi.number().optional(),
            finalGrainHumidity: Joi.number().optional(),
        }),
    }),
};

export const updateBatchFermentationSchema: DefaultValidation = {
    params: Joi.object().keys({
        id: Joi.number().integer().min(1).required(),
    }),
    body: Joi.object({
        fermentation: Joi.object({
            id: Joi.forbidden(),
            codeBatch: Joi.forbidden(),
            cocoaType: Joi.string().optional(),
            startDate: Joi.date().iso().optional(),
            genetics: Joi.string().optional(),
            weight: Joi.number().optional(),
            brixDegrees: Joi.number().optional(),
            humidity: Joi.number().optional(),
            hoursDrained: Joi.number().optional(),
            nrFlips: Joi.forbidden(),
            totalDays: Joi.number().optional(),
        }),
    }),
};

export const updateBatchPulpSchema: DefaultValidation = {
    params: Joi.object().keys({
        id: Joi.number().integer().min(1).required(),
    }),
    body: Joi.object({
        pulp: Joi.object({
            id: Joi.forbidden(),
            codeProducer: Joi.forbidden(),

            pricePerKg: Joi.number().optional(),
            collectionDate: Joi.date().iso().optional(),
            quality: Joi.string().optional(),
            status: Joi.string().optional(),
            genetics: Joi.string().optional(),
            totalPulpKg: Joi.number().optional(),
            totalPrice: Joi.number().optional(),
        }),
    }),
};
