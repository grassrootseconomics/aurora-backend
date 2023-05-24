import { NextFunction, Request, Response } from 'express';

import ApiError from '@/utils/types/errors/ApiError';
import { JWTToken } from '@/utils/types/server';

/**
 *
 * Checks whether authentication details are present.
 *
 */
const requiresAuth = (_req: Request, res: Response, next: NextFunction) => {
    const authDetails: JWTToken = res['locals']['jwt'];

    if (!authDetails) {
        return next(new ApiError(401, 'You are not authenticated!'));
    }

    next();
};

export default requiresAuth;
