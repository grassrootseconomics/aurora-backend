import Joi from 'joi';

import { DefaultValidation } from '../types/server';

export const updateDepartmentSchema: DefaultValidation = {
    params: Joi.object().keys({
        id: Joi.number().integer().min(1).required(),
    }),
    body: Joi.object({
        department: Joi.object({
            id: Joi.forbidden(),
            name: Joi.string().optional(),
            description: Joi.string().optional(),
            nextHarvest: Joi.date().iso().optional(),
            nrOfAssociates: Joi.forbidden(),
        }),
    }),
};
