import { NextFunction, Request, Response } from 'express';

import { SERVER } from '@/config';
import jwt from 'jsonwebtoken';

import ApiError from '@/utils/types/errors/ApiError';

/**
 * Extracts the JWT from the Authorization Header.
 */
const extractJWT = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (token) {
        jwt.verify(token, SERVER.ACCESS_TOKEN.SECRET, (error, decoded) => {
            if (error)
                return next(
                    new ApiError(
                        404,
                        'Invalid authentication token!',
                        error.stack
                    )
                );
            res.locals.jwt = decoded;
        });
    }
    next();
};

export default extractJWT;
