import { NextFunction, Request, Response } from 'express';

import { getUserByWalletAddress } from '@/services/authService';

import ApiError from '@/utils/types/errors/ApiError';
import { JWTToken } from '@/utils/types/server';

/**
 *
 * Checks whether authentication details are present.
 *
 */
const requiresAuth = async (
    _req: Request,
    res: Response,
    next: NextFunction
) => {
    const authDetails: JWTToken = res['locals']['jwt'];

    if (!authDetails) {
        return next(new ApiError(401, 'You are not authenticated!'));
    }
    const user = await getUserByWalletAddress(authDetails.address);

    if (!user) {
        return next(
            new ApiError(401, 'No user exists with that wallet address!')
        );
    }
    next();
};

export default requiresAuth;
