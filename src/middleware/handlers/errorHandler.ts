import { NextFunction, Response } from 'express';

import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

import ApiError from '../../utils/types/errors/ApiError';
import { IResponseStructure } from '../../utils/types/server';

/**
 *
 * Converts the unknown error to a API Error.
 *
 * @param {unknown} err Unkown Error.
 * @returns {ApiError}
 */
const convertErrorToApiError = (err: unknown): ApiError => {
    if (!(err instanceof ApiError)) {
        if (err instanceof PrismaClientKnownRequestError) {
            return new ApiError(404, 'Record to update does not exist!');
        }
        return new ApiError(500, 'Internal Error');
    } else return err;
};

export const errorHandler = (
    err: unknown,
    _req: any,
    res: Response<IResponseStructure>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: NextFunction
) => {
    const apiError = convertErrorToApiError(err);
    return res.status(apiError.statusCode).json({
        success: false,
        message: `Encountered an Error.`,
        error: {
            message: apiError.message,
        },
    });
};
