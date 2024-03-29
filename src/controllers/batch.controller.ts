import { NextFunction, Request, Response, Router } from 'express';

import { Association, Producer } from '@prisma/client';

import asyncMiddleware from '@/middleware/asyncMiddleware';
import extractJWT from '@/middleware/extractJWT';
import requiresAuth from '@/middleware/guards/requiresAuth';
import requiresRoles from '@/middleware/guards/requiresRole';
import validate from '@/middleware/validate';

import { getAssociationNameOfProducerByUserWallet } from '@/services/authService';
import {
    addBatchFermentationDayReport,
    addBatchFermentationFlip,
    getBatchByCode,
    getBatchFermentationModelByCode,
    getMonthlyCocoaPulp,
    getMonthlySalesInUSD,
    getProductionByDepartment,
    getProductionOfDryCocoa,
    getSalesInKgByAssociation,
    getSalesInKgByDepartment,
    getSumKGOfCocoaBySoldStatus,
    getUSDPriceOfOrganicCocoa,
    removeBatchFermentationDayReport,
    removeBatchFermentationFlip,
    searchBatches,
    updateBatchDryingPhase,
    updateBatchFermentationDayReport,
    updateBatchFermentationFlip,
    updateBatchFermentationPhase,
    updateBatchSalesPhase,
    updateBatchStoragePhase,
} from '@/services/batchService';
import { getDepartmentsHarvestDatesByName } from '@/services/departmentService';
import { sendBatchRequestEmails } from '@/services/emailService';
import {
    generateAvailableBatchesExcel,
    generateSoldBatchesExcel,
} from '@/services/excelService';
import { getAllProducers } from '@/services/producerService';
import { getBatchRequestUserEmails } from '@/services/userService';

import { APP_CONSTANTS } from '@/utils/constants';
import { EmailParameters } from '@/utils/types/association/EmailParameters';
import {
    DryingPhaseUpdate,
    FermentationPhaseUpdate,
    SalesPhaseUpdate,
    StoragePhaseUpdate,
} from '@/utils/types/batch';
import { BasicAvailableBatch } from '@/utils/types/batch/available';
import { BasicSoldBatch } from '@/utils/types/batch/sold';
import ApiError from '@/utils/types/errors/ApiError';
import {
    DayReport,
    DayReportUpdate,
} from '@/utils/types/fermentation/DayReport';
import { Flip, FlipUpdate } from '@/utils/types/fermentation/Flip';
import {
    BuyerReport,
    DashboardStatistics,
    ProducerReport,
    ProjectReport,
} from '@/utils/types/reports';
import { JWTToken } from '@/utils/types/server';
import {
    addBatchDayReportSchema,
    addBatchFlipReportSchema,
    sendBatchRequestEmailsSchema,
    updateBatchDayReportSchema,
    updateBatchDryingSchema,
    updateBatchFermentationSchema,
    updateBatchFlipReportSchema,
    updateBatchSalesSchema,
    updateBatchStorageSchema,
} from '@/utils/validations/batchValidations';

import assocInfo from '../utils/assocDetails.json';

const router = Router();

router.get(
    '/',
    extractJWT,
    asyncMiddleware(async (req: Request, res: Response) => {
        const token: JWTToken = res.locals.jwt;
        // Fetching available parameters for every type of user.
        const year: number | undefined = isNaN(
            parseInt(req.query.year?.toString())
        )
            ? undefined
            : parseInt(req.query.year?.toString());

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

        // For buyer to filter by department
        const department: string | undefined = req.query.department?.toString();

        let report: Partial<BuyerReport> &
            Partial<ProducerReport> &
            Partial<ProjectReport> = {};

        const statistics: DashboardStatistics = {
            nrCocoaProducers: 0,
            nrYoungMen: 0,
            nrWomen: 0,
            haForestConservation: 0,
            departmentHarvestDates: [],
        };

        let producers: Producer[] = [];
        // This needs filtering by year
        const searchBatchesResult = await searchBatches({
            search: '',
            index,
            limit,
            filterField: 'department',
            filterValue: department,
            sold: false,
            internationallySold: false,
            year,
        });

        if (
            !token ||
            (token && token.role !== 'project' && token.role !== 'association')
        ) {
            const [
                productionByOrigin,
                internationalSalesInKg,
                kgAvailableCocoa,
                producersByDepartment,
            ] = await Promise.all([
                getProductionByDepartment(year, department),
                getSalesInKgByDepartment(true, year, department),
                getSumKGOfCocoaBySoldStatus(
                    year,
                    false,
                    false,
                    'department',
                    department
                ),
                getAllProducers({ department }),
            ]);

            producers = producersByDepartment;

            statistics.kgDryCocoaAvailable = kgAvailableCocoa
                ? kgAvailableCocoa.toNumber()
                : 0;
            statistics.departmentHarvestDates =
                await getDepartmentsHarvestDatesByName(department);
            report['productionByOrigin'] = productionByOrigin;
            report['internationalSalesInKg'] = internationalSalesInKg;
        } else {
            if (token.role === 'association') {
                const userAssociationName =
                    await getAssociationNameOfProducerByUserWallet(
                        token.address
                    );
                const [
                    productionOfDryCocoa,
                    salesInKg,
                    monthlyCocoaPulp,
                    monthlySalesInUSD,
                    kgDryCocoaAvailable,
                    kgDryCocoaInternationallySold,
                    producersByAssociation,
                ] = await Promise.all([
                    getProductionOfDryCocoa(year, userAssociationName),
                    getSalesInKgByAssociation(false, year, userAssociationName),
                    getMonthlyCocoaPulp(year, userAssociationName),
                    getMonthlySalesInUSD(year, userAssociationName),
                    getSumKGOfCocoaBySoldStatus(
                        year,
                        false,
                        false,
                        'association',
                        userAssociationName
                    ),
                    getSumKGOfCocoaBySoldStatus(
                        year,
                        true,
                        true,
                        'association',
                        userAssociationName
                    ),
                    getAllProducers({ association: userAssociationName }),
                ]);
                producers = producersByAssociation;
                report = {
                    productionOfDryCocoa,
                    salesInKg,
                    monthlyCocoaPulp,
                    monthlySalesInUSD,
                };
                statistics.kgDryCocoaAvailable = kgDryCocoaAvailable
                    ? kgDryCocoaAvailable.toNumber()
                    : 0;
                statistics.kgDryCocoaInternationallySold =
                    kgDryCocoaInternationallySold
                        ? kgDryCocoaInternationallySold.toNumber()
                        : 0;
            } else {
                const [
                    productionOfDryCocoa,
                    priceOfOrganicCocoa,
                    productionByRegions,
                    monthlySalesInUSD,
                    kgDryCocoaAvailable,
                    kgDryCocoaInternationallySold,
                    allProducers,
                ] = await Promise.all([
                    getProductionOfDryCocoa(year),
                    getUSDPriceOfOrganicCocoa(year),
                    getProductionByDepartment(year),
                    getMonthlySalesInUSD(year),
                    getSumKGOfCocoaBySoldStatus(
                        year,
                        false,
                        false,
                        'association',
                        ''
                    ),
                    getSumKGOfCocoaBySoldStatus(
                        year,
                        true,
                        true,
                        'association',
                        ''
                    ),
                    getAllProducers({}),
                ]);
                producers = allProducers;

                report = {
                    productionOfDryCocoa,
                    priceOfOrganicCocoa,
                    productionByRegions,
                    monthlySalesInUSD,
                };
                statistics.kgDryCocoaAvailable = kgDryCocoaAvailable.toNumber();
                statistics.kgDryCocoaInternationallySold =
                    kgDryCocoaInternationallySold.toNumber();
            }
            statistics.nrYoungMen = producers.filter(
                (producer) =>
                    producer.gender.toLowerCase() === 'male' &&
                    new Date().getFullYear() - producer.birthYear < 30
            ).length;
            statistics.nrWomen = producers.filter(
                (producer) => producer.gender === 'female'
            ).length;
        }

        statistics.nrCocoaProducers = producers.length;
        statistics.haForestConservation = producers.reduce(
            (prev, current) => prev + current.nrForestHa.toNumber(),
            0
        );

        res.status(200).json({
            success: true,
            message: 'Information',
            data: {
                searchBatchesResult,
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

        // For project users to filter by association
        let association: string | undefined =
            req.query.association && req.query.association.toString() !== ''
                ? req.query.association?.toString()
                : undefined;
        // For producers & project users to search by batch code.
        const search: string | undefined = req.query.search?.toString();

        // Only users with the project role can filter by associations.
        if (token.role === 'association')
            association = await getAssociationNameOfProducerByUserWallet(
                token.address
            );
        // Fetch batches to calculate internationally sold.
        const searchBatchesResult = await searchBatches({
            search,
            index,
            limit,
            filterField: 'association',
            filterValue: association,
            internationallySold: false,
            sold: true,
            year,
        });

        const [salesInKg, monthlySalesInUSD, kgDryCocoaInternationallySold] =
            await Promise.all([
                getSalesInKgByAssociation(false, year, association),
                getMonthlySalesInUSD(year, association),
                getSumKGOfCocoaBySoldStatus(
                    year,
                    true,
                    true,
                    'association',
                    association
                ),
            ]);

        return res.status(200).json({
            success: true,
            message: APP_CONSTANTS.RESPONSE.BATCH.FETCH_SUCCESS,
            data: {
                searchBatchesResult,
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

        // For project users to filter by association
        let association: string | undefined =
            req.query.association && req.query.association.toString() !== ''
                ? req.query.association?.toString()
                : undefined;
        // For producers & project users to search by batch code.
        const search: string | undefined = req.query.search?.toString();

        // Only users with the project role can filter by associations.
        if (token.role === 'association')
            association = await getAssociationNameOfProducerByUserWallet(
                token.address
            );

        // Fetch batches to calculate available kg.
        const searchBatchesResult = await searchBatches({
            search,
            index,
            limit,
            filterField: 'association',
            filterValue: association,
            sold: false,
            year,
        });

        const [monthlyCocoaPulp, productionOfDryCocoa, kgDryCocoaAvailable] =
            await Promise.all([
                getMonthlyCocoaPulp(year, association),
                getProductionOfDryCocoa(year, association),
                getSumKGOfCocoaBySoldStatus(
                    year,
                    false,
                    false,
                    'association',
                    association
                ),
            ]);

        return res.status(200).json({
            success: true,
            message: APP_CONSTANTS.RESPONSE.BATCH.FETCH_SUCCESS,
            data: {
                searchBatchesResult,
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

        const assoc: Association | null =
            batch.pulpsUsed.length > 0
                ? batch.pulpsUsed[0].pulp.producer.association
                : null;

        // Default to association information.
        const assocDescription: any = {
            en: assoc ? assoc.description : '',
            es: assoc ? assoc.description : '',
        };

        if (batch.pulpsUsed.length > 0 && assoc && assocInfo[assoc.name]) {
            assocDescription.en = assocInfo[assoc.name].description.en;
            assocDescription.es = assocInfo[assoc.name].description.es;
        }
        batch.pulpsUsed.forEach((pulpUsed, index) => {
            batch.pulpsUsed[index].pulp.producer.association.description =
                assocDescription;
        });

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
    extractJWT,
    requiresAuth,
    requiresRoles(['association']),
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
    extractJWT,
    requiresAuth,
    requiresRoles(['association']),
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
    extractJWT,
    requiresAuth,
    requiresRoles(['association']),
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
    extractJWT,
    requiresAuth,
    requiresRoles(['association']),
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

router.post(
    '/:code/sample-request',
    validate(sendBatchRequestEmailsSchema),
    asyncMiddleware(async (req: Request, res: Response, next: NextFunction) => {
        const { code } = req.params;
        const emailFields: EmailParameters = req.body.fields;

        if (!emailFields) {
            return next(new ApiError(400, 'Missing Email Fields Parameter!'));
        }

        const emails = await getBatchRequestUserEmails(code);

        if (emails.length === 0) {
            return res.status(500).json({
                success: false,
                message: 'No emails to send batch request to.',
            });
        }

        const emailResponse = await sendBatchRequestEmails(
            emails,
            emailFields,
            code
        );

        if (emailResponse.accepted.length > 0) {
            return res.status(200).json({
                success: true,
                message: 'Sample Request Email successfully sent!',
                data: { emailResponse },
            });
        } else {
            return res.status(500).json({
                success: false,
                message:
                    'Could not send request email to all batch-related users.',
            });
        }
    })
);

router.post(
    '/:id/fermentation/flips',
    validate(addBatchFlipReportSchema),
    asyncMiddleware(async (req: Request, res: Response, next: NextFunction) => {
        const id: number = parseInt(req.params.id);
        if (!id || Number.isNaN(id)) {
            return next(
                new ApiError(
                    400,
                    APP_CONSTANTS.RESPONSE.FERMENTATION.INVALID_ID
                )
            );
        }
        const newDetails: Flip = req.body.flip;

        const newFermentationDetails = await addBatchFermentationFlip(
            id,
            newDetails
        );

        return res.status(200).json({
            success: true,
            message: APP_CONSTANTS.RESPONSE.FERMENTATION.FLIP.SAVE_SUCCESS,
            data: {
                updatedValues: newFermentationDetails.flips,
            },
        });
    })
);

router.post(
    '/:id/fermentation/reports',
    validate(addBatchDayReportSchema),
    asyncMiddleware(async (req: Request, res: Response, next: NextFunction) => {
        const id: number = parseInt(req.params.id);
        if (!id || Number.isNaN(id)) {
            return next(
                new ApiError(
                    400,
                    APP_CONSTANTS.RESPONSE.FERMENTATION.INVALID_ID
                )
            );
        }
        const newDetails: DayReport = req.body.dayReport;

        const newFermentationDetails = await addBatchFermentationDayReport(
            id,
            newDetails
        );

        return res.status(200).json({
            success: true,
            message:
                APP_CONSTANTS.RESPONSE.FERMENTATION.DAY_REPORT.SAVE_SUCCESS,
            data: {
                updatedValues: newFermentationDetails.dailyReports,
            },
        });
    })
);

router.patch(
    '/:id/fermentation/flips/:flipIndex',
    extractJWT,
    requiresAuth,
    requiresRoles(['association']),
    validate(updateBatchFlipReportSchema),
    asyncMiddleware(async (req: Request, res: Response, next: NextFunction) => {
        const id: number = parseInt(req.params.id);
        const flipIndex: number = parseInt(req.params.flipIndex);

        if (!id || Number.isNaN(id)) {
            return next(
                new ApiError(
                    400,
                    APP_CONSTANTS.RESPONSE.FERMENTATION.INVALID_ID
                )
            );
        }

        if (Number.isNaN(flipIndex)) {
            return next(
                new ApiError(
                    400,
                    APP_CONSTANTS.RESPONSE.FERMENTATION.FLIP.INVALID_INDEX
                )
            );
        }

        const newDetails: FlipUpdate = req.body.flip;

        const updatedFermentation = await updateBatchFermentationFlip(
            id,
            flipIndex,
            newDetails
        );

        return res.status(200).json({
            success: true,
            message: APP_CONSTANTS.RESPONSE.FERMENTATION.UPDATE_SUCCESS,
            data: {
                updatedValues: updatedFermentation.flips,
            },
        });
    })
);

router.patch(
    '/:id/fermentation/reports/:dayIndex',
    extractJWT,
    requiresAuth,
    requiresRoles(['association']),
    validate(updateBatchDayReportSchema),
    asyncMiddleware(async (req: Request, res: Response, next: NextFunction) => {
        const id: number = parseInt(req.params.id);
        const dayIndex: number = parseInt(req.params.dayIndex);

        if (!id || Number.isNaN(id)) {
            return next(
                new ApiError(
                    400,
                    APP_CONSTANTS.RESPONSE.FERMENTATION.INVALID_ID
                )
            );
        }

        if (Number.isNaN(dayIndex)) {
            return next(
                new ApiError(
                    400,
                    APP_CONSTANTS.RESPONSE.FERMENTATION.DAY_REPORT.INVALID_INDEX
                )
            );
        }

        const newDetails: DayReportUpdate = req.body.dayReport;

        const updatedFermentation = await updateBatchFermentationDayReport(
            id,
            dayIndex,
            newDetails
        );

        return res.status(200).json({
            success: true,
            message: APP_CONSTANTS.RESPONSE.FERMENTATION.UPDATE_SUCCESS,
            data: {
                updatedValues: updatedFermentation.dailyReports,
            },
        });
    })
);

router.delete(
    '/:id/fermentation/flips/:flipIndex',
    extractJWT,
    requiresAuth,
    requiresRoles(['association']),
    asyncMiddleware(async (req: Request, res: Response, next: NextFunction) => {
        const id: number = parseInt(req.params.id);
        const flipIndex: number = parseInt(req.params.flipIndex);

        if (!id || Number.isNaN(id)) {
            return next(
                new ApiError(
                    400,
                    APP_CONSTANTS.RESPONSE.FERMENTATION.INVALID_ID
                )
            );
        }

        if (Number.isNaN(flipIndex)) {
            return next(
                new ApiError(
                    400,
                    APP_CONSTANTS.RESPONSE.FERMENTATION.FLIP.INVALID_INDEX
                )
            );
        }

        const updatedValues = await removeBatchFermentationFlip(id, flipIndex);

        return res.status(200).json({
            success: true,
            message: APP_CONSTANTS.RESPONSE.FERMENTATION.UPDATE_SUCCESS,
            data: {
                updatedValues: updatedValues.flips,
            },
        });
    })
);

router.delete(
    '/:id/fermentation/reports/:dayIndex',
    extractJWT,
    requiresAuth,
    requiresRoles(['association']),
    asyncMiddleware(async (req: Request, res: Response, next: NextFunction) => {
        const id: number = parseInt(req.params.id);
        const dayIndex: number = parseInt(req.params.dayIndex);

        if (!id || Number.isNaN(id)) {
            return next(
                new ApiError(
                    400,
                    APP_CONSTANTS.RESPONSE.FERMENTATION.INVALID_ID
                )
            );
        }

        if (Number.isNaN(dayIndex)) {
            return next(
                new ApiError(
                    400,
                    APP_CONSTANTS.RESPONSE.FERMENTATION.DAY_REPORT.INVALID_INDEX
                )
            );
        }

        const updatedValues = await removeBatchFermentationDayReport(
            id,
            dayIndex
        );

        return res.status(200).json({
            success: true,
            message: APP_CONSTANTS.RESPONSE.FERMENTATION.UPDATE_SUCCESS,
            data: {
                updatedValues: updatedValues.dailyReports,
            },
        });
    })
);

router.get(
    '/download/all',
    extractJWT,
    requiresAuth,
    requiresRoles(['association']),
    asyncMiddleware(async (req: Request, res: Response) => {
        try {
            const token: JWTToken = res.locals.jwt;

            // To filter by sold
            const sold: boolean = req.query.sold === 'true';

            const year: number | undefined = isNaN(
                parseInt(req.query.year?.toString())
            )
                ? undefined
                : parseInt(req.query.year?.toString());

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

            let association = null;

            if (token.role === 'association')
                association = await getAssociationNameOfProducerByUserWallet(
                    token.address
                );

            // Fetch batches available batches
            const searchBatchesResult = await searchBatches({
                search: '',
                index,
                limit,
                filterField: 'association',
                filterValue: association,
                sold,
                internationallySold: false,
                year,
            });

            const batchesForExcel = sold
                ? searchBatchesResult.data
                      .filter((b) => b.sale !== undefined)
                      .map(
                          (b) =>
                              new BasicSoldBatch(
                                  b.code,
                                  b.sale.buyer,
                                  b.sale.destination,
                                  b.sale.pricePerKg,
                                  b.sale.totalValue,
                                  b.sale.negotiationTerm,
                                  b.fermentationPhase.cocoaType
                              )
                      )
                : searchBatchesResult.data
                      .filter((b) => b.sale == null)
                      .map(
                          (b) =>
                              new BasicAvailableBatch(
                                  b.code,
                                  Number(b.storage.netWeight),
                                  b.fermentationPhase.cocoaType,
                                  b.fermentationPhase.startDate.toDateString(),
                                  Number(b.fermentationPhase.humidity),
                                  Number(b.storage.grainIndex),
                                  b.storage.sensoryProfile
                              )
                      );

            const workbook = sold
                ? generateSoldBatchesExcel(batchesForExcel)
                : generateAvailableBatchesExcel(batchesForExcel);

            // Set the response headers for Excel download
            res.setHeader(
                'Content-Type',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            );
            res.setHeader(
                'Content-Disposition',
                'attachment; filename=producers.xlsx'
            );

            // Write the workbook to the response and end the response
            await workbook.xlsx.write(res);
            res.end();
        } catch (error) {
            console.log(error);
        }
    })
);

export default router;
