import { NextFunction, Request, Response } from 'express';

import { SERVER } from '@/config';
import jwt from 'jsonwebtoken';

import ApiError from '@/utils/types/errors/ApiError';

const extractJWT = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (token) {
        jwt.verify(token, SERVER.ACCESS_TOKEN.SECRET, (error, decoded) => {
            if (error) {
                return next(
                    new ApiError(
                        404,
                        'Invalid authentication token!',
                        error.stack
                    )
                );
            } else {
                res.locals.jwt = decoded;
                next();
            }
        });
    } else {
        return next(new ApiError(401, 'You are not authenticated!'));
    }
};

export default extractJWT;
