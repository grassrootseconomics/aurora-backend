import { NextFunction, Request, Response, Router } from 'express';

import asyncMiddleware from '@/middleware/asyncMiddleware';

import { getBatchesByProducerCode } from '@/services/batchService';
import { getProducerByCode, searchProducers } from '@/services/producerService';
import { getPulpsByProducerCode } from '@/services/pulpService';

import { APP_CONSTANTS } from '@/utils/constants';
import ApiError from '@/utils/types/errors/ApiError';
import { ISearchParameters } from '@/utils/types/server';

const router = Router();

router.get(
    '/',
    asyncMiddleware(async (req: Request, res: Response) => {
        const options: ISearchParameters = req.body.options;

        const producers = await searchProducers({ ...options });
        return res.status(200).json({
            success: true,
            message: APP_CONSTANTS.RESPONSE.PRODUCER.SEARCH_SUCCESS,
            data: {
                producers,
            },
        });
    })
);

router.get(
    '/:code',
    asyncMiddleware(async (req: Request, res: Response, next: NextFunction) => {
        const { code } = req.params;

        if (!code) {
            next(
                new ApiError(400, APP_CONSTANTS.RESPONSE.PRODUCER.MISSING_CODE)
            );
        }

        const producer = await getProducerByCode(code);

        return res.status(200).json({
            success: true,
            message: APP_CONSTANTS.RESPONSE.PRODUCER.FETCH_SUCCESS,
            data: {
                producer,
            },
        });
    })
);

router.get(
    '/:code/batches',
    asyncMiddleware(async (req: Request, res: Response, next: NextFunction) => {
        const { code } = req.params;

        if (!code) {
            next(
                new ApiError(400, APP_CONSTANTS.RESPONSE.PRODUCER.MISSING_CODE)
            );
        }
        const batches = await getBatchesByProducerCode(code);
        const pulps = await getPulpsByProducerCode(code);
        return res.status(200).json({
            success: true,
            message: APP_CONSTANTS.RESPONSE.BATCH.FETCH_SUCCESS,
            data: {
                batches,
                pulps,
            },
        });
    })
);

export default router;
