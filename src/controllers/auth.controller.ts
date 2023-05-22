import { NextFunction, Request, Response, Router } from 'express';

import asyncMiddleware from '@/middleware/asyncMiddleware';

import {
    getAccessToken,
    getNonce,
    getRefreshToken,
} from '@/services/authService';

import ApiError from '@/utils/types/errors/ApiError';

const router = Router();

router.get(
    '/nonce',
    asyncMiddleware(async (req: Request, res: Response, next: NextFunction) => {
        const address: string = req.query.address
            ? req.query.address.toString()
            : null;

        if (!address) {
            return next(new ApiError(400, 'Missing Address'));
        }

        const nonce: string = await getNonce(address);

        if (nonce !== null) {
            res.status(200).json({
                success: true,
                message: 'Successfully generated nonce!',
                data: {
                    nonce,
                },
            });
        } else {
            return next(new ApiError(500, 'Internal Server Error'));
        }
    })
);

router.get(
    '/rtoken',
    asyncMiddleware(async (req: Request, res: Response, next: NextFunction) => {
        const address: string = req.query.address
            ? req.query.address.toString()
            : null;
        const nonce: string = req.query.nonce
            ? req.query.nonce.toString()
            : null;
        const signature: string = req.query.signature
            ? req.query.signature.toString()
            : null;

        if (!address || !nonce || !signature) {
            next(new ApiError(400, `Missing parameters`));
        }
        const rToken: string = await getRefreshToken(address, nonce, signature);
        if (rToken !== null) {
            res.status(200).json({
                success: true,
                message: 'Generated Refresh Token!',
                data: {
                    rToken,
                },
            });
        } else {
            return next(new ApiError(500, 'Internal Server Error'));
        }
    })
);

router.get(
    '/atoken',
    asyncMiddleware(async (req: Request, res: Response, next: NextFunction) => {
        const refreshToken: string = req.query.rtoken
            ? req.query.rtoken.toString()
            : null;

        if (!refreshToken) {
            return next(new ApiError(400, `Missing parameters`));
        }
        const accessToken: string = await getAccessToken(refreshToken);
        if (accessToken !== null) {
            res.status(200).json({
                success: true,
                message: 'Generated Access Token!',
                data: {
                    aToken: accessToken,
                },
            });
        } else {
            return next(new ApiError(500, 'Internal Server Error'));
        }
    })
);

export default router;
