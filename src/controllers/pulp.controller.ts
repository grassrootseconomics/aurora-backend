import { NextFunction, Request, Response, Router } from 'express';

import asyncMiddleware from '@/middleware/asyncMiddleware';
import extractJWT from '@/middleware/extractJWT';
import requiresAuth from '@/middleware/guards/requiresAuth';
import requiresRoles from '@/middleware/guards/requiresRole';
import validate from '@/middleware/validate';

import { checkBatchExistsByCode } from '@/services/batchService';
import { checkProducerExistsByCode } from '@/services/producerService';
import {
    addPulp,
    getPulpById,
    removePulpById,
    updatePulpById,
} from '@/services/pulpService';

import { APP_CONSTANTS } from '@/utils/constants';
import ApiError from '@/utils/types/errors/ApiError';
import { AddPulp, UpdatePulp } from '@/utils/types/pulp';
import {
    addPulpSchema,
    updatePulpSchema,
} from '@/utils/validations/pulpValidations';

const router = Router();

router.get(
    '/:id',
    extractJWT,
    requiresAuth,
    requiresRoles(['association']),
    asyncMiddleware(async (req: Request, res: Response, next: NextFunction) => {
        const id: number = parseInt(req.params.id);

        if (!id || Number.isNaN(id)) {
            return next(
                new ApiError(400, APP_CONSTANTS.RESPONSE.PULP.INVALID_ID)
            );
        }

        const pulp = await getPulpById(id);

        res.status(200).json({
            success: true,
            message: 'Successfully fetched pulp',
            data: {
                pulp,
            },
        });
    })
);

router.post(
    '/',
    extractJWT,
    requiresAuth,
    requiresRoles(['association']),
    validate(addPulpSchema),
    asyncMiddleware(async (req: Request, res: Response, next: NextFunction) => {
        const pulpData: AddPulp = req.body.pulp;

        const { codeBatch, codeProducer } = pulpData;

        if (codeBatch) {
            const batchExists = await checkBatchExistsByCode(codeBatch);

            if (!batchExists) {
                return next(
                    new ApiError(400, APP_CONSTANTS.RESPONSE.BATCH.NOT_FOUND)
                );
            }
        }

        const producerExists = await checkProducerExistsByCode(codeProducer);

        if (!producerExists) {
            return next(
                new ApiError(400, APP_CONSTANTS.RESPONSE.PRODUCER.NOT_FOUND)
            );
        }

        const newPulp = await addPulp(pulpData);

        res.status(200).json({
            success: true,
            message: APP_CONSTANTS.RESPONSE.PULP.SAVE.SUCCESS,
            data: {
                newPulp,
            },
        });
    })
);

router.patch(
    '/:id',
    extractJWT,
    requiresAuth,
    requiresRoles(['association']),
    validate(updatePulpSchema),
    asyncMiddleware(async (req: Request, res: Response, next: NextFunction) => {
        const id: number = parseInt(req.params.id);
        const pulpData: UpdatePulp = req.body.pulp;

        if (!id || Number.isNaN(id)) {
            return next(
                new ApiError(400, APP_CONSTANTS.RESPONSE.PULP.INVALID_ID)
            );
        }

        if (!pulpData) {
            return next(
                new ApiError(
                    400,
                    APP_CONSTANTS.RESPONSE.PULP.UPDATE.MISSING_VALUES
                )
            );
        }

        const { codeBatch, codeProducer } = pulpData;

        if (codeBatch) {
            const batchExists = await checkBatchExistsByCode(codeBatch);

            if (!batchExists) {
                return next(
                    new ApiError(400, APP_CONSTANTS.RESPONSE.BATCH.NOT_FOUND)
                );
            }
        }

        if (codeProducer) {
            const producerExists = await checkProducerExistsByCode(
                codeProducer
            );

            if (!producerExists) {
                return next(
                    new ApiError(400, APP_CONSTANTS.RESPONSE.PRODUCER.NOT_FOUND)
                );
            }
        }

        const updatedPulp = await updatePulpById(id, pulpData);

        res.status(200).json({
            success: true,
            message: APP_CONSTANTS.RESPONSE.PULP.UPDATE.SUCCESS,
            data: {
                updatedPulp,
            },
        });
    })
);

router.delete(
    '/:id',
    extractJWT,
    requiresAuth,
    requiresRoles(['association']),
    asyncMiddleware(async (req: Request, res: Response, next: NextFunction) => {
        const id: number = parseInt(req.params.id);

        if (!id || Number.isNaN(id)) {
            return next(
                new ApiError(400, APP_CONSTANTS.RESPONSE.PULP.INVALID_ID)
            );
        }

        const removedPulp = await removePulpById(id);

        res.status(200).json({
            success: true,
            message: APP_CONSTANTS.RESPONSE.PULP.DELETE.SUCCESS,
            data: {
                removedPulp,
            },
        });
    })
);

export default router;
