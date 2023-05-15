import { NextFunction, Request, Response } from 'express';

import Joi from 'joi';

import ApiError from '@/utils/types/errors/ApiError';
import { DefaultValidation } from '@/utils/types/server';

const validate =
    (schema: DefaultValidation) =>
    (req: Request, _res: Response, next: NextFunction) => {
        const object = {};
        Object.keys(schema).map((key) => {
            object[key] = req[key];
        });
        const { value, error } = Joi.compile(schema)
            .prefs({ errors: { label: 'key' }, abortEarly: true })
            .validate(object);
        if (error) {
            const errorMessage = error.details
                .map((details) => details.message)
                .join(', ');
            return next(new ApiError(400, errorMessage));
        }
        Object.assign(req, value);
        return next();
    };

export default validate;
