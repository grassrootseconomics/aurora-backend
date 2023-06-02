import { prisma } from '@/db';
import {
    Batch,
    DryingPhase,
    FermentationPhase,
    Sale,
    Storage,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime';

import {
    DryingPhaseUpdate,
    FermentationPhaseUpdate,
    ISearchBatchParams,
    SalesPhaseUpdate,
    StoragePhaseUpdate,
} from '@/utils/types/batch';
import {
    MonthlyOrganicSoldPrice,
    MonthlyProductionOfCacao,
    MonthlyPulpCollected,
    MonthlySalesInKg,
    MonthlySalesInUSD,
} from '@/utils/types/reports';

/**
 *
 * Calculates the total kg of available/sold cocoa.
 *
 * @param {number} year Year to filter by.
 * @param {boolean} sold Available/sold status.
 * @param {boolean} onlyInternational Wether to filter for internationaly sold only.
 * @param {string} department Optional to filter by department of batch producers.
 * @param {string} association Optional to filter by association of batch producers.
 * @returns {Promise<Decimal>}
 */
export const getSumKGOfCocoaBySoldStatus = async (
    year: number = new Date().getFullYear(),
    sold: boolean = false,
    onlyInternational: boolean = false,
    department: string = '',
    association: string = ''
): Promise<Decimal | null> => {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);
    const aggregation = await prisma.storage.aggregate({
        where: {
            AND: [
                {
                    batch: onlyInternational
                        ? {
                              sale: {
                                  negotiation: 'International',
                              },
                          }
                        : sold
                        ? { NOT: { sale: null } }
                        : { sale: null },
                },
                {
                    dayEntry: {
                        gte: startDate.toISOString(),
                        lte: endDate.toISOString(),
                    },
                },
                {
                    batch: {
                        pulpsUsed: {
                            some: {
                                pulp: {
                                    producer: {
                                        department: {
                                            name: {
                                                contains: department,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                {
                    batch: {
                        pulpsUsed: {
                            some: {
                                pulp: {
                                    producer: {
                                        association: {
                                            name: {
                                                contains: association,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            ],
        },
        _sum: {
            netWeight: true,
        },
    });

    return aggregation._sum.netWeight;
};

/**
 *
 * Groups production in kg of dry cocoa by month in a year.
 *
 * Each month report contains the kg sold of each department/origin.
 *
 * @param {number} year Year to filter by.
 * @param departmentName
 * @returns {Promise<MonthlyProductionOfCacao>}
 */
export const getProductionByDepartment = async (
    year: number = new Date().getFullYear(),
    departmentName?: string
): Promise<MonthlyProductionOfCacao> => {
    const regionsWithProduction = await prisma.department.findMany({
        where: {
            name: departmentName,
        },
        include: {
            producers: {
                include: {
                    producedPulps: {
                        include: {
                            batchesUsedFor: {
                                include: {
                                    batch: {
                                        include: {
                                            storage: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    const reports: MonthlyProductionOfCacao = [...Array(12)].map(() => {
        const departmentsReport = {};

        regionsWithProduction.forEach((department) => {
            departmentsReport[department.name] = 0;
        });

        return departmentsReport;
    });

    reports.forEach((_el, index) => {
        Object.keys(reports[index]).map((department) => {
            const departmentData = regionsWithProduction.find(
                (dep) => dep.name === department
            );

            departmentData.producers.forEach((producer) => {
                producer.producedPulps.forEach((pulp) => {
                    reports[index][department] += pulp.batchesUsedFor.reduce(
                        (prev, current) => {
                            const dayEntry = current.batch.storage.dayEntry;
                            if (
                                dayEntry.getFullYear() === year &&
                                dayEntry.getMonth() === index
                            ) {
                                return (
                                    prev +
                                    current.batch.storage.netWeight.toNumber()
                                );
                            } else {
                                return prev + 0;
                            }
                        },
                        0
                    );
                });
            });
        });
    });

    return reports;
};

/**
 *
 * Sums up the average USD price of Organic Cocoa by month in a year.
 *
 * @param {number} year Year to filter by.
 * @returns {Promise<MonthlyOrganicSoldPrice>}
 */
export const getUSDPriceOfOrganicCocoa = async (
    year: number = new Date().getFullYear()
): Promise<MonthlyOrganicSoldPrice> => {
    const batches = await prisma.batch.findMany({
        where: {
            AND: [
                {
                    fermentationPhase: {
                        cocoaType: 'organic',
                    },
                },
                {
                    sale: {
                        currency: 'USD',
                    },
                },
            ],
        },
        include: {
            sale: true,
            fermentationPhase: true,
        },
    });

    const reports: MonthlyOrganicSoldPrice = [...Array(12)].map(() => {
        return {
            organicSoldPrice: 0,
        };
    });

    reports.forEach((_element, index) => {
        const filteredBatches = batches.filter(
            (batch) =>
                batch.sale.negotiationDate.getFullYear() === year &&
                batch.sale.negotiationDate.getMonth() === index
        );

        reports[index].organicSoldPrice =
            filteredBatches.reduce(
                (prev, current) => prev + current.sale.totalValue,
                0
            ) / filteredBatches.length;
    });

    return reports;
};

/**
 *
 * Groups batch kg sales sold in a year by months.
 *
 * Each month report contains the kg sold of each association.
 *
 * @param onlyInternational Flag to filter for international sales only; Default to false.
 * @param {number} year Year to filter by.
 * @param associationName Association to filter by.
 * @returns {Promise<MonthlySalesInKg>}
 */
export const getSalesInKgByAssociation = async (
    onlyInternational: boolean = false,
    year: number = new Date().getFullYear(),
    associationName?: string
): Promise<MonthlySalesInKg> => {
    // Query by optional association name,
    // optional international sales
    // and only sold batches
    const associationsWithBatches = await prisma.association.findMany({
        where: {
            AND: [
                {
                    name: associationName,
                },
                {
                    producers: {
                        some: {
                            producedPulps: {
                                some: {
                                    batchesUsedFor: {
                                        some: {
                                            batch: onlyInternational
                                                ? {
                                                      sale: {
                                                          negotiation:
                                                              'International',
                                                      },
                                                  }
                                                : { NOT: { sale: null } },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            ],
        },
        include: {
            producers: {
                include: {
                    producedPulps: {
                        include: {
                            batchesUsedFor: {
                                include: {
                                    batch: {
                                        include: {
                                            storage: true,
                                            sale: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    const reports: MonthlySalesInKg = [...Array(12)].map(() => {
        const associationReport = {};
        associationsWithBatches.forEach((assoc) => {
            associationReport[assoc.name] = 0;
        });

        return associationReport;
    });

    reports.forEach((_element, index) => {
        Object.keys(reports[index]).map((association) => {
            const associationData = associationsWithBatches.find(
                (assoc) => assoc.name === association
            );

            // Add all kgs in storage of batches of an association
            associationData.producers.forEach((producer) => {
                producer.producedPulps.forEach((pulp) => {
                    reports[index][association] += pulp.batchesUsedFor.reduce(
                        (prev, current) => {
                            if (!current.batch.sale) return prev + 0;
                            const dayEntry = current.batch.sale.negotiationDate;
                            if (
                                dayEntry.getFullYear() === year &&
                                dayEntry.getMonth() === index
                            )
                                return (
                                    prev +
                                    current.batch.storage.netWeight.toNumber()
                                );
                            else return prev + 0;
                        },
                        0
                    );
                });
            });
        });
    });

    return reports;
};

/**
 *
 * Groups batch kg quantity sold in a year by months.
 *
 * Each month report contains the kg sold of each department/origin.
 *
 * @param onlyInternational Flag to filter for international sales only; Default to false.
 * @param {number} year Year to filter by.
 * @param {string} departmentName Department to filter by.
 * @returns {Promise<MonthlySalesInKg>}
 */
export const getSalesInKgByDepartment = async (
    onlyInternational: boolean = false,
    year: number = new Date().getFullYear(),
    departmentName?: string
): Promise<MonthlySalesInKg> => {
    const regionsWithSale = await prisma.department.findMany({
        where: {
            AND: [
                { name: departmentName },
                {
                    producers: {
                        some: {
                            producedPulps: {
                                some: {
                                    batchesUsedFor: {
                                        some: {
                                            batch: onlyInternational
                                                ? {
                                                      sale: {
                                                          negotiation:
                                                              'International',
                                                      },
                                                  }
                                                : { NOT: { sale: null } },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            ],
        },
        include: {
            producers: {
                include: {
                    producedPulps: {
                        include: {
                            batchesUsedFor: {
                                include: {
                                    batch: {
                                        include: {
                                            storage: true,
                                            sale: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    const reports: MonthlySalesInKg = [...Array(12)].map(() => {
        const departmentReport = {};
        regionsWithSale.forEach((department) => {
            departmentReport[department.name] = 0;
        });

        return departmentReport;
    });

    reports.forEach((_el, index) => {
        Object.keys(reports[index]).map((department) => {
            const departmentData = regionsWithSale.find(
                (dep) => dep.name === department
            );

            departmentData.producers.forEach((producer) => {
                producer.producedPulps.forEach((pulp) => {
                    reports[index][department] += pulp.batchesUsedFor.reduce(
                        function (prev, current) {
                            const dayEntry = current.batch.sale.negotiationDate;
                            if (
                                dayEntry.getFullYear() === year &&
                                dayEntry.getMonth() === index
                            ) {
                                return (
                                    prev +
                                    current.batch.storage.netWeight.toNumber()
                                );
                            } else return prev + 0;
                        },
                        0
                    );
                });
            });
        });
    });

    return reports;
};

/**
 *
 * Groups batch sales in USD in a year by months.
 *
 * Each month report contains the sales in USD of each association.
 *
 * @param {number} year Year to filter by.
 * @param {string} associationName Association to filter by.
 * @returns {Promise<MonthlySalesInUSD>}
 */
export const getMonthlySalesInUSD = async (
    year: number = new Date().getFullYear(),
    associationName?: string
): Promise<MonthlySalesInUSD> => {
    const batches = await prisma.batch.findMany({
        where: {
            AND: [
                {
                    // THIS NEEDS CHANGING!
                    association: {
                        name: associationName,
                    },
                },
                {
                    NOT: { sale: null },
                },
            ],
        },
        include: {
            sale: true,
        },
    });
    // Instantiate empty report.
    const reports: MonthlySalesInUSD = [...Array(12)].map(() => {
        return { salesInUSD: 0 };
    });

    reports.forEach((_element, index) => {
        const filteredBatches = batches.filter(
            (batch) =>
                batch.sale.negotiationDate.getFullYear() === year &&
                batch.sale.negotiationDate.getMonth() === index &&
                batch.sale.currency === 'US'
        );

        reports[index].salesInUSD = filteredBatches.reduce(
            (prev, batch) => prev + batch.sale.totalValue,
            0
        );
    });

    return reports;
};
/**
 *
 * Groups collected cocoa pulp in a year by months.
 *
 * Each month report contains the production of each association.
 *
 * @param {number} year Year to filter by.
 * @param {string} associationName Association to filter by.
 * @returns {Promise<MonthlyPulpCollected>}
 */
export const getMonthlyCocoaPulp = async (
    year: number = new Date().getFullYear(),
    associationName?: string
): Promise<MonthlyPulpCollected> => {
    const pulpOfAssociation = await prisma.pulp.findMany({
        where: {
            producer: {
                association: {
                    name: associationName,
                },
            },
        },
        include: {
            producer: {
                include: {
                    association: true,
                },
            },
        },
    });

    const reports: MonthlyPulpCollected = [...Array(12)].map(() => {
        return {
            pulpKg: 0,
        };
    });

    reports.forEach((_el, index) => {
        const pulps = pulpOfAssociation.filter(
            (pulps) =>
                pulps.collectionDate.getFullYear() === year &&
                pulps.collectionDate.getMonth() === index
        );

        reports[index].pulpKg = pulps.reduce(
            (prev, current) => prev + current.totalPulpKg.toNumber(),
            0
        );
    });

    return reports;
};

/**
 *
 * Groups production of dry cocoa in a year by months.
 *
 * Each month report contains the production of each association.
 *
 * @param {number} year Year to filter by.
 * @param {string} associationName Association to filter by.
 * @returns {Promise<MonthlyProductionOfCacao>}
 */
export const getProductionOfDryCocoa = async (
    year: number = new Date().getFullYear(),
    associationName?: string
): Promise<MonthlyProductionOfCacao> => {
    const associationsWithBatches = await prisma.association.findMany({
        where: {
            name: associationName,
        },
        include: {
            producers: {
                include: {
                    producedPulps: {
                        include: {
                            batchesUsedFor: {
                                include: {
                                    batch: {
                                        include: {
                                            storage: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    const reports: MonthlyProductionOfCacao = [...Array(12)].map(() => {
        const associationReport = {};

        associationsWithBatches.forEach((assoc) => {
            associationReport[assoc.name] = 0;
        });

        return associationReport;
    });

    reports.forEach((_element, index) => {
        Object.keys(reports[index]).map((association) => {
            const associationData = associationsWithBatches.find(
                (assoc) => assoc.name === association
            );

            associationData.producers.forEach((producer) => {
                producer.producedPulps.forEach((pulp) => {
                    reports[index][association] += pulp.batchesUsedFor.reduce(
                        (prev, current) => {
                            const dayEntry = current.batch.storage.dayEntry;
                            if (
                                dayEntry.getFullYear() === year &&
                                dayEntry.getMonth() === index
                            ) {
                                return (
                                    prev +
                                    current.batch.storage.netWeight.toNumber()
                                );
                            } else {
                                return prev + 0;
                            }
                        },
                        0
                    );
                });
            });
        });
    });

    return reports;
};

/**
 *
 * Fetches every `Batch` with its optional `Sale` and `Storage` Prop included.
 *
 * `Batches` that have no `Sale` or `Storage` return with undefined `Sale` or `Storage`.
 *
 * @returns `Batches` with `Sales` and `Storage` attached.
 */
export const getAllBatchesWithSoldAndSalePhases = () => {
    return prisma.batch.findMany({
        include: {
            storage: true,
            sale: true,
        },
    });
};

/**
 *
 * Fetches batches by their sale status; Default to true.
 *
 * @param {boolean} sold If the batch was sold.
 * @param {boolean} onlyInternational Optional flag to filter by international sales.
 * @param {string} associationName Optional flag to filter by association.
 */
export const getBatchesBySoldStatus = (
    sold: boolean = true,
    onlyInternational: boolean = false,
    associationName?: string
) => {
    return prisma.batch.findMany({
        where: {
            AND: [
                {
                    pulpsUsed: {
                        some: {
                            pulp: {
                                producer: {
                                    association: {
                                        name: associationName,
                                    },
                                },
                            },
                        },
                    },
                },
                onlyInternational
                    ? {
                          sale: {
                              negotiation: 'International',
                          },
                      }
                    : sold
                    ? { NOT: { sale: null } }
                    : { sale: null },
            ],
        },
        include: {
            sale: true,
            storage: true,
            fermentationPhase: {
                include: {
                    flips: true,
                },
            },
            pulpsUsed: {
                include: {
                    pulp: {
                        include: {
                            producer: true,
                        },
                    },
                },
            },
        },
    });
};

/**
 *
 * Fetches a batch by its code.
 *
 * @param {string} code Batch Code.
 * @returns {Promise<Batch | null>}
 */
export const getBatchByCode = (code: string): Promise<Batch | null> => {
    return prisma.batch.findUnique({
        where: { code },
        include: {
            sale: true,
            storage: true,
            dryingPhase: true,
            fermentationPhase: {
                include: {
                    flips: true,
                    dailyReports: true,
                },
            },
            pulpsUsed: {
                include: {
                    pulp: {
                        include: {
                            producer: {
                                include: {
                                    association: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });
};

/**
 *
 * Fetches the Fermentation Model of a Batch.
 *
 * @param {string} code Batch Code.
 * @returns {Promise<FermentationPhase | null>}
 */
export const getBatchFermentationModelByCode = (
    code: string
): Promise<FermentationPhase | null> => {
    return prisma.fermentationPhase.findUnique({
        where: { codeBatch: code },
        include: { flips: true, dailyReports: true },
    });
};

/**
 *
 * Queries for Batches by a given collection of Pulp IDs.
 *
 *
 * @param {number[]} pulpIds Pulp Ids.
 * @returns {Promise<Batch[]>}
 */
export const getBatchesByPulpIds = async (
    pulpIds: number[]
): Promise<Batch[]> => {
    const pulpBatches = await prisma.pulpBatch.findMany({
        where: {
            idPulp: {
                in: pulpIds,
            },
        },
        include: {
            batch: {
                include: {
                    sale: true,
                    storage: true,
                    dryingPhase: true,
                    fermentationPhase: true,
                },
            },
        },
    });

    return pulpBatches.map((pulpBatch) => pulpBatch.batch);
};

/**
 *
 * Searches, paginates and filters batches by batch code and department.
 *
 * @param {ISearchBatchParams} options Search Filters.
 * @returns
 */
export const searchBatches = async ({
    search = '',
    index = 0,
    limit = 10,
    filterField = 'association',
    filterValue = '',
    sold = false,
    internationallySold = false,
    year = new Date().getFullYear(),
}: ISearchBatchParams) => {
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (year) {
        startDate = new Date(year, 0, 1);
        endDate = new Date(year + 1, 0, 1);
    }

    const data = await prisma.batch.findMany({
        // I should switch this to a cursor approach.
        skip: index * limit,
        take: limit,
        where: {
            AND: [
                {
                    code: {
                        contains: search,
                    },
                },
                {
                    pulpsUsed: {
                        some: {
                            pulp: {
                                producer: {
                                    [filterField]: {
                                        name: {
                                            contains: filterValue,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                internationallySold !== undefined
                    ? internationallySold
                        ? { sale: { negotiation: 'International' } }
                        : { NOT: { sale: { negotiation: 'International' } } }
                    : sold !== undefined
                    ? sold
                        ? { NOT: { sale: null } }
                        : { sale: null }
                    : null,
                year !== undefined
                    ? {
                          storage: {
                              dayEntry: {
                                  gte: startDate.toISOString(),
                                  lte: endDate.toISOString(),
                              },
                          },
                      }
                    : null,
            ],
        },
        include: {
            sale: true,
            storage: true,
            fermentationPhase: {
                include: {
                    flips: true,
                },
            },
            pulpsUsed: {
                include: {
                    pulp: {
                        include: {
                            producer: {
                                include: {
                                    department: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    const count = await prisma.batch.count({
        where: {
            AND: [
                {
                    code: {
                        contains: search,
                    },
                },
                {
                    pulpsUsed: {
                        some: {
                            pulp: {
                                producer: {
                                    [filterField]: {
                                        name: {
                                            contains: filterValue,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                internationallySold !== undefined
                    ? internationallySold
                        ? { sale: { negotiation: 'International' } }
                        : { NOT: { sale: { negotiation: 'International' } } }
                    : sold !== undefined
                    ? sold
                        ? { NOT: { sale: null } }
                        : { sale: null }
                    : null,
                year !== undefined
                    ? {
                          storage: {
                              dayEntry: {
                                  gte: startDate.toISOString(),
                                  lte: endDate.toISOString(),
                              },
                          },
                      }
                    : null,
            ],
        },
    });

    return {
        data,
        totalEntries: count,
        totalPages: Math.ceil(count / limit),
        page: index,
    };
};

/**
 *
 * Updates and returns the Sales Phase Details of a Batch.
 *
 * @param {number} id Id of the Sales Phase.
 * @param {Partial<SalesPhase>} salesPhase New Sales Phase Details.
 * @returns {Promise<Sale>}
 */
export const updateBatchSalesPhase = async (
    id: number,
    salesPhase: Partial<SalesPhaseUpdate>
): Promise<Sale> => {
    return await prisma.sale.update({
        where: { id },
        data: salesPhase,
    });
};

/**
 *
 * Updates and returns the Storage Phase Details of a Batch.
 *
 * @param {number} id Id of the Storage Phase.
 * @param {Partial<StoragePhase>} storagePhase New Storage Details Phase
 * @returns {Promise<Storage>}
 */
export const updateBatchStoragePhase = async (
    id: number,
    storagePhase: Partial<StoragePhaseUpdate>
): Promise<Storage> => {
    return await prisma.storage.update({
        where: { id },
        data: storagePhase,
    });
};

/**
 *
 * Updates and returns the Drying Phase Details of a Batch.
 *
 * @param {number} id Id of the Drying Phase.
 * @param {Partial<DryingPhase>} dryingPhase New Drying Phase Details
 * @returns {Promise<DryingPhase>}
 */
export const updateBatchDryingPhase = async (
    id: number,
    dryingPhase: Partial<DryingPhaseUpdate>
): Promise<DryingPhase> => {
    return await prisma.dryingPhase.update({
        where: { id },
        data: dryingPhase,
    });
};

/**
 *
 * Updates and returns the Fermentation Phase Details of a Batch.
 *
 * @param {number} id Id of the Fermentation Phase.
 * @param {Partial<FermentationPhaseUpdate>} fermentationPhase New Fermentation Phase Details
 * @returns {Promise<FermentationPhase>}
 */
export const updateBatchFermentationPhase = async (
    id: number,
    fermentationPhase: Partial<FermentationPhaseUpdate>
): Promise<FermentationPhase> => {
    return await prisma.fermentationPhase.update({
        where: { id },
        data: fermentationPhase,
    });
};
