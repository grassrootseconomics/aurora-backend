import { NextFunction, Request, Response, Router } from 'express';

import asyncMiddleware from '@/middleware/asyncMiddleware';
import extractJWT from '@/middleware/extractJWT';
import requiresAuth from '@/middleware/guards/requiresAuth';
import requiresRoles from '@/middleware/guards/requiresRole';
import validate from '@/middleware/validate';

import {
    getAllBatchesWithSoldAndSalePhases,
    getBatchByCode,
    getBatchFermentationModelByCode,
    getBatchesBySoldStatus,
    getMonthlyCocoaPulp,
    getMonthlySalesInUSD,
    getProductionByDepartment,
    getProductionOfDryCocoa,
    getSalesInKgByAssociation,
    getSalesInKgByDepartment,
    getUSDPriceOfOrganicCocoa,
    searchBatches,
    updateBatchDryingPhase,
    updateBatchFermentationPhase,
    updateBatchSalesPhase,
    updateBatchStoragePhase,
} from '@/services/batchService';
import { getAllProducers } from '@/services/producerService';

import { APP_CONSTANTS } from '@/utils/constants';
import { getAgeByBirthDate } from '@/utils/methods/date';
import {
    DryingPhaseUpdate,
    FermentationPhaseUpdate,
    ISearchBatchParams,
    SalesPhaseUpdate,
    StoragePhaseUpdate,
} from '@/utils/types/batch';
import ApiError from '@/utils/types/errors/ApiError';
import {
    BuyerReport,
    DashboardStatistics,
    ProducerReport,
    ProjectReport,
} from '@/utils/types/reports';
import { JWTToken } from '@/utils/types/server';
import {
    updateBatchDryingSchema,
    updateBatchFermentationSchema,
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
    '/report/',
    extractJWT,
    asyncMiddleware(async (req: Request, res: Response) => {
        const token: JWTToken = res.locals.jwt;

        // Fetching available parameters for every type of user.
        const year: number | undefined = isNaN(
            parseInt(req.query.year?.toString())
        )
            ? undefined
            : parseInt(req.query.year?.toString());
        const department: string | undefined = req.query.department?.toString();

        let report: Partial<BuyerReport> &
            Partial<ProducerReport> &
            Partial<ProjectReport> = {};

        const statistics: DashboardStatistics = {
            nrCocoaProducers: 0,
            nrYoungMen: 0,
            nrWomen: 0,
            haForestConservation: 0,
        };

        // Fetching available statistics for every type of user.
        const producers = await getAllProducers();
        // This needs filtering by year
        const batches = await getAllBatchesWithSoldAndSalePhases();

        statistics.nrCocoaProducers = producers.length;
        statistics.haForestConservation = producers.reduce(
            (prev, current) => prev + current.nrForestHa.toNumber(),
            0
        );

        if (
            !token ||
            (token && token.role !== 'project' && token.role !== 'association')
        ) {
            statistics.nrYoungMen = producers.filter(
                (producer) =>
                    producer.gender.toLowerCase() === 'male' &&
                    getAgeByBirthDate(producer.birthDate) < 30
            ).length;
            statistics.nrWomen = producers.filter(
                (producer) => producer.gender === 'female'
            ).length;
            const [productionByOrigin, internationalSalesInKg] =
                await Promise.all([
                    getProductionByDepartment(year, department),
                    getSalesInKgByDepartment(true, year, department),
                ]);

            report['productionByOrigin'] = productionByOrigin;
            report['internationalSalesInKg'] = internationalSalesInKg;
        } else {
            // Authenticated get more cocoa statistics data.
            // Filtered by year.
            statistics.kgDryCocoaAvailable = batches.reduce((prev, batch) => {
                // Only non-sold cocoa
                if (
                    !batch.sale &&
                    batch.storage.dayEntry.getFullYear() === year
                )
                    return prev + batch.storage.netWeight.toNumber();
            }, 0);
            statistics.kgDryCocoaInternationallySold = batches.reduce(
                (prev, batch) => {
                    // Only sold cocoa
                    if (
                        batch.sale &&
                        batch.sale.negotiation === 'International' &&
                        batch.storage.dayEntry.getFullYear() === year
                    )
                        return prev + batch.storage.netWeight.toNumber();
                },
                0
            );

            if (token.role === 'association') {
                const [
                    productionOfDryCocoa,
                    salesInKg,
                    monthlyCocoaPulp,
                    monthlySalesInUSD,
                ] = await Promise.all([
                    getProductionOfDryCocoa(year),
                    getSalesInKgByAssociation(false, year),
                    getMonthlyCocoaPulp(year),
                    getMonthlySalesInUSD(year),
                ]);
                report = {
                    productionOfDryCocoa,
                    salesInKg,
                    monthlyCocoaPulp,
                    monthlySalesInUSD,
                };
            } else {
                const [
                    productionOfDryCocoa,
                    priceOfOrganicCocoa,
                    productionByRegions,
                    monthlySalesInUSD,
                ] = await Promise.all([
                    getProductionOfDryCocoa(year),
                    getUSDPriceOfOrganicCocoa(year),
                    getProductionByDepartment(year),
                    getMonthlySalesInUSD(year),
                ]);
                report = {
                    productionOfDryCocoa,
                    priceOfOrganicCocoa,
                    productionByRegions,
                    monthlySalesInUSD,
                };
            }
        }

        res.status(200).json({
            success: true,
            message: 'Information',
            data: {
                report,
                statistics,
            },
        });
    })
);

router.get(
    '/sold',
    extractJWT,
    requiresAuth,
    requiresRoles(['project', 'association']),
    asyncMiddleware(async (req: Request, res: Response) => {
        // Need reports & statistics for this page as well.
        const token: JWTToken = res.locals.jwt;

        const year: number | undefined = isNaN(
            parseInt(req.query.year?.toString())
        )
            ? undefined
            : parseInt(req.query.year?.toString());
        let association: string | undefined = req.query.association?.toString();

        // Only users with the project role can filter by associations.
        if (token.role === 'association') association = undefined;

        // Fetch batches to calculate internationally sold.
        const batches = (
            await getBatchesBySoldStatus(true, true, association)
        ).filter((batch) => batch.storage.dayEntry.getFullYear() === year);

        const kgDryCocoaInternationallySold = batches.reduce(
            (prev, current) => prev + current.storage.netWeight.toNumber(),
            0
        );

        const [salesInKg, monthlySalesInUSD] = await Promise.all([
            getSalesInKgByAssociation(false, year, association),
            getMonthlySalesInUSD(year, association),
        ]);

        return res.status(200).json({
            success: true,
            message: APP_CONSTANTS.RESPONSE.BATCH.FETCH_SUCCESS,
            data: {
                batches,
                statistics: {
                    kgDryCocoaInternationallySold,
                },
                report: {
                    salesInKg,
                    monthlySalesInUSD,
                },
            },
        });
    })
);

router.get(
    '/available',
    extractJWT,
    requiresAuth,
    requiresRoles(['project', 'association']),
    asyncMiddleware(async (req: Request, res: Response) => {
        const token: JWTToken = res.locals.jwt;

        const year: number | undefined = isNaN(
            parseInt(req.query.year?.toString())
        )
            ? undefined
            : parseInt(req.query.year?.toString());
        let association: string | undefined = req.query.association?.toString();

        // Only users with the project role can filter by associations.
        if (token.role === 'association') association = undefined;

        // Fetch batches to calculate available kg.
        const batches = (
            await getBatchesBySoldStatus(false, false, association)
        ).filter((batch) => batch.storage.dayEntry.getFullYear() === year);

        const kgDryCocoaAvailable = batches.reduce(
            (prev, current) => prev + current.storage.netWeight.toNumber(),
            0
        );

        const [monthlyCocoaPulp, productionOfDryCocoa] = await Promise.all([
            getMonthlyCocoaPulp(year, association),
            getProductionOfDryCocoa(year, association),
        ]);

        return res.status(200).json({
            success: true,
            message: APP_CONSTANTS.RESPONSE.BATCH.FETCH_SUCCESS,
            data: {
                batches,
                statistics: {
                    kgDryCocoaAvailable,
                },
                report: {
                    monthlyCocoaPulp,
                    productionOfDryCocoa,
                },
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

export default router;
