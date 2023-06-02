import { NextFunction, Request, Response, Router } from 'express';

import { Association, Department } from '@prisma/client';

import asyncMiddleware from '@/middleware/asyncMiddleware';
import extractJWT from '@/middleware/extractJWT';
import requiresAuth from '@/middleware/guards/requiresAuth';
import requiresRoles from '@/middleware/guards/requiresRole';
import validate from '@/middleware/validate';

import { getAssociationById } from '@/services/associationService';
import { getAssociationOfProducerByUserWallet } from '@/services/authService';
import { getBatchesByPulpIds } from '@/services/batchService';
import { getDepartmentById } from '@/services/departmentService';
import {
    checkProducerLinkedToBatch,
    getAllProducers,
    getProducerByCode,
    linkProducerToBatch,
    searchProducers,
    unlinkProducerFromBatch,
    updateProducerByCode,
} from '@/services/producerService';
import { getPulpsByProducerCode } from '@/services/pulpService';

import { APP_CONSTANTS } from '@/utils/constants';
import ApiError from '@/utils/types/errors/ApiError';
import { ProducerUpdate } from '@/utils/types/producer';
import { ProducersStatistics } from '@/utils/types/reports';
import { JWTToken } from '@/utils/types/server';
import {
    changeProducerFromBatch,
    updateProducerSchema,
} from '@/utils/validations/producerValidations';

const router = Router();

router.get(
    '/',
    extractJWT,
    requiresAuth,
    requiresRoles(['project', 'association']),
    asyncMiddleware(async (req: Request, res: Response) => {
        const token: JWTToken = res.locals.jwt;

        const search: string | undefined = req.query.search?.toString();
        // For pagination
        const index: number | undefined = isNaN(
            parseInt(req.query.index?.toString())
        )
            ? undefined
            : parseInt(req.query.index?.toString());
        const limit: number | undefined = isNaN(
            parseInt(req.query.limit?.toString())
        )
            ? undefined
            : parseInt(req.query.limit?.toString());

        let association: string | undefined = req.query.association?.toString();
        // Only users with the project role can filter by associations.
        if (token.role === 'association')
            association = await getAssociationOfProducerByUserWallet(
                token.address
            );

        const statistics: ProducersStatistics = {
            nrCocoaProducers: 0,
            nrYoungMen: 0,
            nrWomen: 0,
            haForestConservation: 0,
        };

        const searchProducersResult = await searchProducers({
            search,
            index,
            limit,
            filterField: 'association',
            filterValue: association,
        });

        const producers = await getAllProducers({ association });

        statistics.nrYoungMen = producers.filter(
            (producer) =>
                producer.gender.toLowerCase() === 'male' &&
                new Date().getFullYear() - producer.birthYear < 30
        ).length;
        statistics.nrWomen = producers.filter(
            (producer) => producer.gender === 'female'
        ).length;

        return res.status(200).json({
            success: true,
            message: APP_CONSTANTS.RESPONSE.PRODUCER.SEARCH_SUCCESS,
            data: {
                searchProducersResult,
                statistics,
            },
        });
    })
);

router.get(
    '/:code',
    extractJWT,
    requiresAuth,
    requiresRoles(['project', 'association']),
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
    extractJWT,
    requiresAuth,
    requiresRoles(['project', 'association']),
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

router.post(
    `/:codeProducer/batches/:codeBatch`,
    extractJWT,
    requiresAuth,
    requiresRoles(['project', 'association']),
    validate(changeProducerFromBatch),
    asyncMiddleware(async (req: Request, res: Response, next: NextFunction) => {
        const { codeProducer, codeBatch } = req.params;

        const producerAlreadyLinked = await checkProducerLinkedToBatch(
            codeProducer,
            codeBatch
        );

        if (producerAlreadyLinked) {
            return res.status(400).json({
                success: false,
                message: APP_CONSTANTS.RESPONSE.PRODUCER.LINK_BATCH_EXISTS,
            });
        }

        const added = await linkProducerToBatch(codeProducer, codeBatch);

        if (!added) {
            return res.status(400).json({
                success: false,
                message: APP_CONSTANTS.RESPONSE.PRODUCER.FAILED_BATCH_CHANGE,
            });
        }

        return res.status(200).json({
            success: true,
            message: APP_CONSTANTS.RESPONSE.PRODUCER.UPDATE_SUCCESS,
        });
    })
);

router.patch(
    `/:code`,
    extractJWT,
    requiresAuth,
    requiresRoles(['project', 'association']),
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

router.delete(
    `/:codeProducer/batches/:codeBatch`,
    extractJWT,
    requiresAuth,
    requiresRoles(['project', 'association']),
    validate(changeProducerFromBatch),
    asyncMiddleware(async (req: Request, res: Response) => {
        const { codeProducer, codeBatch } = req.params;

        const deleted = await unlinkProducerFromBatch(codeProducer, codeBatch);

        if (!deleted) {
            return res.status(400).json({
                success: false,
                message: APP_CONSTANTS.RESPONSE.PRODUCER.FAILED_BATCH_CHANGE,
            });
        }

        return res.status(200).json({
            success: true,
            message: APP_CONSTANTS.RESPONSE.PRODUCER.UPDATE_SUCCESS,
        });
    })
);

export default router;
