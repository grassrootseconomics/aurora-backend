import Joi from 'joi';

import { DefaultValidation } from '../types/server';

export const updateProducerSchema: DefaultValidation = {
    params: Joi.object().keys({
        code: Joi.string().required(),
    }),
    body: Joi.object({
        producer: Joi.object({
            id: Joi.forbidden(),
            codeBatch: Joi.forbidden(),
            firstName: Joi.string().optional(),
            lastName: Joi.string().optional(),
            phoneNumber: Joi.string().optional(),
            gender: Joi.string().optional(),
            birthDate: Joi.date().iso().optional(),

            // DEPARTMENT FOREGIN KEY
            idDepartment: Joi.number().integer().min(1).optional(),

            municipiality: Joi.string().optional(),
            village: Joi.string().optional(),

            // ASSOCIATION FOREIGN KEY
            idAssociation: Joi.number().integer().min(1).optional(),

            farmName: Joi.string().optional(),
            location: Joi.string().optional(),

            nrOfHa: Joi.number().optional(),
            nrCocoaHa: Joi.number().optional(),
            nrForestHa: Joi.number().optional(),
            nrCocoaLots: Joi.number().optional(),
            nrWaterSources: Joi.number().optional(),
            wildlife: Joi.string().optional(),
        }),
    }),
};
