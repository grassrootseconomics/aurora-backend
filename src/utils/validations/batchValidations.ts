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
            destination: Joi.string().optional(),
            currency: Joi.string().optional(),
            pricePerKg: Joi.number().optional(),
            totalValue: Joi.number().optional(),
            negotiationDate: Joi.date().iso().optional(),
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
            brixDegrees: Joi.number().optional(),
            weight: Joi.number().optional(),
            humidity: Joi.number().optional(),
            hoursDrained: Joi.number().optional(),
            nrFlips: Joi.forbidden(),
            totalDays: Joi.number().optional(),
        }),
    }),
};

export const addBatchFlipReportSchema: DefaultValidation = {
    body: Joi.object({
        flip: Joi.object({
            type: Joi.string().optional(),
            time: Joi.number().optional(),
            temp: Joi.number().optional(),
            ambient: Joi.number().optional(),
            humidity: Joi.number().optional(),
        }),
    }),
};

export const updateBatchFlipReportSchema: DefaultValidation = {
    params: Joi.object().keys({
        id: Joi.number().integer().min(1).required(),
        flipIndex: Joi.number().integer().min(0).required(),
    }),
    body: Joi.object({
        flip: Joi.object({
            type: Joi.string().optional(),
            time: Joi.number().optional(),
            temp: Joi.number().optional(),
            ambient: Joi.number().optional(),
            humidity: Joi.number().optional(),
        }),
    }),
};

export const addBatchDayReportSchema: DefaultValidation = {
    params: Joi.object().keys({
        id: Joi.number().integer().min(1).required(),
    }),
    body: Joi.object({
        dayReport: Joi.object({
            temperatureMass: Joi.number().optional(),
            phMass: Joi.number().optional(),
            phCotiledon: Joi.number().optional(),
        }),
    }),
};

export const updateBatchDayReportSchema: DefaultValidation = {
    params: Joi.object().keys({
        id: Joi.number().integer().min(1).required(),
        dayIndex: Joi.number().integer().min(0).required(),
    }),
    body: Joi.object({
        dayReport: Joi.object({
            temperatureMass: Joi.number().optional(),
            phMass: Joi.number().optional(),
            phCotiledon: Joi.number().optional(),
        }),
    }),
};

export const sendBatchRequestEmailsSchema: DefaultValidation = {
    params: Joi.object().keys({
        code: Joi.string().required(),
    }),
    body: Joi.object({
        fields: Joi.object({
            country: Joi.string().required(),
            city: Joi.string().required(),
            name: Joi.string().required(),
            contactNumber: Joi.string().required(),
            email: Joi.string().required(),
            message: Joi.string().required(),
        }),
    }),
};
