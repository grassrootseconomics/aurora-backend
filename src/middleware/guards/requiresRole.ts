import { NextFunction, Request, Response } from 'express';

import ApiError from '@/utils/types/errors/ApiError';
import { JWTToken, Roles } from '@/utils/types/server';

/**
 *
 * Returns a middleware configured to allow the specified roles as parameters.
 *
 * @param {Roles[]} roles Roles allowed.
 * @returns
 */
const requiresRoles =
    (roles: Roles[]) => (_req: Request, res: Response, next: NextFunction) => {
        const authDetails: JWTToken = res['locals']['jwt'];

        if (!roles.includes(authDetails.role)) {
            return next(
                new ApiError(401, 'You do not meet the required roles!')
            );
        }

        next();
    };

export default requiresRoles;
