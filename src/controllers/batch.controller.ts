import { NextFunction, Request, Response, Router } from 'express';

import asyncMiddleware from '@/middleware/asyncMiddleware';

import {
    getBatchByCode,
    getBatchFermentationModelByCode,
    getBatchesBySoldStatus,
    searchBatches,
} from '@/services/batchService';

import { APP_CONSTANTS } from '@/utils/constants';
import ISearchBatchParams from '@/utils/types/batch/ISearchBatchParams';
import ApiError from '@/utils/types/errors/ApiError';

const router = Router();

router.get(
    '/',
    asyncMiddleware(async (req: Request, res: Response) => {
        const options: ISearchBatchParams = req.body.options;

        const result = await searchBatches(options);

        return res.status(200).json({
            success: true,
            message: APP_CONSTANTS.RESPONSE.BATCH.FETCH_SUCCESS,
            data: {
                result,
            },
        });
    })
);

router.get(
    '/sold',
    asyncMiddleware(async (_req: Request, res: Response) => {
        const batches = await getBatchesBySoldStatus(true);
        return res.status(200).json({
            success: true,
            message: APP_CONSTANTS.RESPONSE.BATCH.FETCH_SUCCESS,
            data: {
                batches,
            },
        });
    })
);

router.get(
    '/available',
    asyncMiddleware(async (_req: Request, res: Response) => {
        const batches = await getBatchesBySoldStatus(false);
        return res.status(200).json({
            success: true,
            message: APP_CONSTANTS.RESPONSE.BATCH.FETCH_SUCCESS,
            data: {
                batches,
            },
        });
    })
);

router.get(
    '/:code',
    asyncMiddleware(async (req: Request, res: Response, next: NextFunction) => {
        const { code } = req.params;

        if (!code) {
            next(new ApiError(400, APP_CONSTANTS.RESPONSE.BATCH.MISSING_CODE));
        }

        const batch = await getBatchByCode(code);

        return res.status(200).json({
            success: true,
            message: APP_CONSTANTS.RESPONSE.BATCH.FETCH_SUCCESS,
            data: {
                batch,
            },
        });
    })
);

router.get(
    '/:code/fermentation',
    asyncMiddleware(async (req: Request, res: Response, next: NextFunction) => {
        const { code } = req.params;

        if (!code) {
            next(new ApiError(400, APP_CONSTANTS.RESPONSE.BATCH.MISSING_CODE));
        }

        const fermentationPhase = await getBatchFermentationModelByCode(code);

        return res.status(200).json({
            success: true,
            message: APP_CONSTANTS.RESPONSE.BATCH.FETCH_SUCCESS,
            data: {
                fermentationPhase,
            },
        });
    })
);

export default router;
