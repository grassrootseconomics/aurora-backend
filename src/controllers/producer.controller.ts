import { NextFunction, Request, Response, Router } from 'express';

import { Association, Department } from '@prisma/client';

import asyncMiddleware from '@/middleware/asyncMiddleware';
import validate from '@/middleware/validate';

import { getAssociationById } from '@/services/associationService';
import { getBatchesByPulpIds } from '@/services/batchService';
import { getDepartmentById } from '@/services/departmentService';
import {
    getProducerByCode,
    searchProducers,
    updateProducerByCode,
} from '@/services/producerService';
import { getPulpsByProducerCode } from '@/services/pulpService';

import { APP_CONSTANTS } from '@/utils/constants';
import ApiError from '@/utils/types/errors/ApiError';
import { ProducerUpdate } from '@/utils/types/producer';
import { ISearchParameters } from '@/utils/types/server';
import { updateProducerSchema } from '@/utils/validations/producerValidations';

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
        const pulps = await getPulpsByProducerCode(code);
        const batches = await getBatchesByPulpIds(pulps.map((pulp) => pulp.id));
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

router.patch(
    `/:code`,
    validate(updateProducerSchema),
    asyncMiddleware(async (req: Request, res: Response, next: NextFunction) => {
        const { code } = req.params;

        const newDetails: Partial<ProducerUpdate> = req.body.producer;

        if (newDetails.idAssociation) {
            const association: Association | null = await getAssociationById(
                newDetails.idAssociation
            );

            if (!association) {
                next(
                    new ApiError(
                        400,
                        APP_CONSTANTS.RESPONSE.ASSOCIATION.NOT_FOUND
                    )
                );
            }
        }

        if (newDetails.idDepartment) {
            const department: Department | null = await getDepartmentById(
                newDetails.idDepartment
            );

            if (!department) {
                next(
                    new ApiError(
                        400,
                        APP_CONSTANTS.RESPONSE.DEPARTMENT.NOT_FOUND
                    )
                );
            }
        }

        const updatedValues = await updateProducerByCode(code, newDetails);

        return res.status(200).json({
            success: true,
            message: APP_CONSTANTS.RESPONSE.PRODUCER.UPDATE_SUCCESS,
            data: {
                updatedValues,
            },
        });
    })
);

export default router;
