import { NextFunction, Request, Response, Router } from 'express';

import asyncMiddleware from '@/middleware/asyncMiddleware';
import validate from '@/middleware/validate';

import {
    getBatchByCode,
    getBatchFermentationModelByCode,
    getBatchesBySoldStatus,
    searchBatches,
    updateBatchDryingPhase,
    updateBatchFermentationPhase,
    updateBatchSalesPhase,
    updateBatchStoragePhase,
} from '@/services/batchService';
import { updatePulp } from '@/services/pulpService';

import { APP_CONSTANTS } from '@/utils/constants';
import {
    DryingPhaseUpdate,
    FermentationPhaseUpdate,
    ISearchBatchParams,
    PulpUpdate,
    SalesPhaseUpdate,
    StoragePhaseUpdate,
} from '@/utils/types/batch';
import ApiError from '@/utils/types/errors/ApiError';
import {
    updateBatchDryingSchema,
    updateBatchFermentationSchema,
    updateBatchPulpSchema,
    updateBatchSalesSchema,
    updateBatchStorageSchema,
} from '@/utils/validations/batchValidations';

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

router.patch(
    `/:id/sale`,
    validate(updateBatchSalesSchema),
    asyncMiddleware(async (req: Request, res: Response, next: NextFunction) => {
        const id: number = parseInt(req.params.id);

        const newDetails: Partial<SalesPhaseUpdate> = req.body.sale;

        const updatedValues = await updateBatchSalesPhase(id, newDetails);

        return res.status(200).json({
            success: true,
            message: APP_CONSTANTS.RESPONSE.BATCH.UPDATE_SUCCESS,
            data: {
                updatedValues,
            },
        });
    })
);

router.patch(
    `/:id/storage`,
    validate(updateBatchStorageSchema),
    asyncMiddleware(async (req: Request, res: Response, next: NextFunction) => {
        const id: number = parseInt(req.params.id);

        const newDetails: Partial<StoragePhaseUpdate> = req.body.storage;

        if (!id || Number.isNaN(id)) {
            next(new ApiError(400, APP_CONSTANTS.RESPONSE.STORAGE.INVALID_ID));
        }

        const updatedValues = await updateBatchStoragePhase(id, newDetails);

        return res.status(200).json({
            success: true,
            message: APP_CONSTANTS.RESPONSE.BATCH.UPDATE_SUCCESS,
            data: {
                updatedValues,
            },
        });
    })
);

router.patch(
    `/:id/drying`,
    validate(updateBatchDryingSchema),
    asyncMiddleware(async (req: Request, res: Response, next: NextFunction) => {
        const id: number = parseInt(req.params.id);

        const newDetails: Partial<DryingPhaseUpdate> = req.body.drying;

        if (!id || Number.isNaN(id)) {
            next(new ApiError(400, APP_CONSTANTS.RESPONSE.STORAGE.INVALID_ID));
        }

        const updatedValues = await updateBatchDryingPhase(id, newDetails);

        return res.status(200).json({
            success: true,
            message: APP_CONSTANTS.RESPONSE.BATCH.UPDATE_SUCCESS,
            data: {
                updatedValues,
            },
        });
    })
);

router.patch(
    `/:id/fermentation`,
    validate(updateBatchFermentationSchema),
    asyncMiddleware(async (req: Request, res: Response, next: NextFunction) => {
        const id: number = parseInt(req.params.id);

        if (!id || Number.isNaN(id)) {
            next(new ApiError(400, APP_CONSTANTS.RESPONSE.STORAGE.INVALID_ID));
        }
        const newDetails: Partial<FermentationPhaseUpdate> =
            req.body.fermentation;

        const updatedValues = await updateBatchFermentationPhase(
            id,
            newDetails
        );

        return res.status(200).json({
            success: true,
            message: APP_CONSTANTS.RESPONSE.BATCH.UPDATE_SUCCESS,
            data: {
                updatedValues,
            },
        });
    })
);

router.patch(
    `/:id/pulp`,
    validate(updateBatchPulpSchema),
    asyncMiddleware(async (req: Request, res: Response, next: NextFunction) => {
        const id: number = parseInt(req.params.id);

        if (!id || Number.isNaN(id)) {
            next(new ApiError(400, APP_CONSTANTS.RESPONSE.STORAGE.INVALID_ID));
        }
        const newDetails: Partial<PulpUpdate> = req.body.pulp;

        const updatedValues = await updatePulp(id, newDetails);

        return res.status(200).json({
            success: true,
            message: APP_CONSTANTS.RESPONSE.BATCH.UPDATE_SUCCESS,
            data: {
                updatedValues,
            },
        });
    })
);

export default router;
