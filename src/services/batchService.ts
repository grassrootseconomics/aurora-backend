import { prisma } from '@/db';
import {
    Batch,
    DryingPhase,
    FermentationPhase,
    Producer,
    Sale,
    Storage,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

import { APP_CONSTANTS } from '@/utils/constants';
import { getAgeByBirthDate } from '@/utils/methods/date';
import {
    DryingPhaseUpdate,
    FermentationPhaseUpdate,
    ISearchBatchParams,
    SalesPhaseUpdate,
    StoragePhaseUpdate,
} from '@/utils/types/batch';
import {
    CertificationAssocDetails,
    CertificationBatchDetails,
    CertificationDryingInfo,
    CertificationFermentationInfo,
    CertificationHarvestingInfo,
    CertificationNFT,
    CertificationProducersInfo,
    CertificationSaleInfo,
    CertificationStorageInfo,
} from '@/utils/types/certification';
import ApiError from '@/utils/types/errors/ApiError';
import {
    DayReport,
    DayReportUpdate,
} from '@/utils/types/fermentation/DayReport';
import { Flip, FlipUpdate } from '@/utils/types/fermentation/Flip';
import {
    MonthlyOrganicSoldPrice,
    MonthlyProductionOfCacao,
    MonthlyPulpCollected,
    MonthlySalesInKg,
    MonthlySalesInUSD,
} from '@/utils/types/reports';

import assocInfo from '../utils/assocDetails.json';
import depInfo from '../utils/depDetails.json';

/**
 *
 * Calculates the total kg of available/sold cocoa.
 *
 * @param {number} year Year to filter by.
 * @param {boolean} sold Available/sold status.
 * @param {boolean} onlyInternational Wether to filter for internationaly sold only.
 * @param {'department' | 'association'} filterField Filter to specify filtering by assoc or department.
 * @param {string} filterValue Name of assoc or department to filter by.
 */
export const getSumKGOfCocoaBySoldStatus = async (
    year: number = new Date().getFullYear(),
    sold: boolean = false,
    onlyInternational: boolean = false,
    filterField: 'department' | 'association',
    filterValue: string
): Promise<Decimal> => {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);
    const aggregation = await prisma.storage.aggregate({
        where: {
            AND: [
                {
                    batch: {
                        fermentationPhase: {
                            NOT: undefined,
                        },
                    },
                },
                {
                    batch: {
                        dryingPhase: {
                            NOT: undefined,
                        },
                    },
                },
                {
                    batch: {
                        sale:
                            onlyInternational || sold
                                ? {
                                      negotiation: onlyInternational
                                          ? 'international'
                                          : {
                                                not: null,
                                            },
                                  }
                                : {
                                      is: null,
                                  },
                    },
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
                            every: {
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
                },
            ],
        },
        _sum: {
            netWeight: true,
        },
    });
    return aggregation._sum.netWeight
        ? aggregation._sum.netWeight
        : new Decimal(0);
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
                batch?.sale?.negotiationDate?.getFullYear() === year &&
                batch?.sale?.negotiationDate?.getMonth() === index
        );
        const sales = filteredBatches.reduce(
            (prev, current) => prev + current?.sale?.totalValue,
            0
        );

        reports[index].organicSoldPrice = sales
            ? sales / filteredBatches.length
            : 0;
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
                associationName
                    ? {
                          name: associationName,
                      }
                    : undefined,
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
                                                              'international',
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
    const checkedBatchCodes: string[] = [];
    reports.forEach((_element, index) => {
        Object.keys(reports[index]).map((association) => {
            const associationData = associationsWithBatches.find(
                (assoc) => assoc.name === association
            );
            checkedBatchCodes.splice(0, checkedBatchCodes.length);
            // Add all kgs in storage of batches of an association
            associationData.producers.forEach((producer) => {
                producer.producedPulps.forEach((pulp) => {
                    reports[index][association] += pulp.batchesUsedFor.reduce(
                        (prev, current) => {
                            if (
                                checkedBatchCodes.includes(current.batch.code)
                            ) {
                                return prev + 0;
                            } else {
                                checkedBatchCodes.push(current.batch.code);
                                if (!current.batch.sale) return prev + 0;
                                const dayEntry =
                                    current.batch.sale.negotiationDate;
                                if (
                                    dayEntry.getFullYear() === year &&
                                    dayEntry.getMonth() === index
                                ) {
                                    return (
                                        prev +
                                        current.batch.storage.netWeight.toNumber()
                                    );
                                } else return prev + 0;
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
                                                              'international',
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

    const checkedBatchCodes: string[] = [];
    reports.forEach((_el, index) => {
        Object.keys(reports[index]).map((department) => {
            const departmentData = regionsWithSale.find(
                (dep) => dep.name === department
            );

            checkedBatchCodes.splice(0, checkedBatchCodes.length);
            departmentData.producers.forEach((producer) => {
                producer.producedPulps.forEach((pulp) => {
                    reports[index][department] += pulp.batchesUsedFor.reduce(
                        function (prev, current) {
                            if (
                                checkedBatchCodes.includes(current.batch.code)
                            ) {
                                return prev + 0;
                            } else {
                                checkedBatchCodes.push(current.batch.code);
                                if (!current.batch.sale) {
                                    return prev + 0;
                                }
                                const dayEntry =
                                    current.batch.sale.negotiationDate;
                                if (
                                    dayEntry.getFullYear() === year &&
                                    dayEntry.getMonth() === index
                                ) {
                                    return (
                                        prev +
                                        current.batch.storage.netWeight.toNumber()
                                    );
                                } else return prev + 0;
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
                    pulpsUsed: {
                        every: {
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
                batch.sale.currency === 'USD'
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
                            if (current.batch.storage) {
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
                        every: {
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
                              negotiation: 'international',
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
            fermentationPhase: true,
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
 * Generate an information snapshot of a batch by its code.
 *
 * @param {string} code Code of the Batch
 *
 * @returns {Promise<CertificationNFT>}
 */
export const getBatchCertificateSnapshotByCode = async (
    code: string
): Promise<CertificationNFT> => {
    const batchInfo = await prisma.batch.findUnique({
        where: {
            code,
        },
        include: {
            sale: true,
            storage: true,
            dryingPhase: true,
            fermentationPhase: true,
            pulpsUsed: {
                include: {
                    pulp: {
                        include: {
                            producer: {
                                include: {
                                    association: true,
                                    department: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    const assoc = batchInfo.pulpsUsed[0]?.pulp.producer.association;

    const dep = batchInfo.pulpsUsed[0]?.pulp.producer.department;

    const batchProducers: Producer[] = [];

    batchInfo.pulpsUsed.forEach((pulpUsed) => {
        const prodFound = batchProducers.find((prod) => {
            return prod.code === pulpUsed.pulp.codeProducer;
        });
        if (!prodFound) batchProducers.push(pulpUsed.pulp.producer);
    });

    const association = await prisma.association.findUnique({
        where: {
            id: assoc.id,
        },
        include: {
            producers: true,
        },
    });

    const assocDetails: CertificationAssocDetails = {
        name: assoc ? assoc.name : '',
        department: assoc ? assoc.department ?? '' : '',
        town: assoc ? assoc.municipiality : '',
        nrOfAssociates: assoc ? assoc.nrOfAssociates : 0,
        nrOfWomen: assoc ? assoc.nrWomen.toNumber() : 0,
        nrOfYoungPeople: assoc ? assoc.nrYoungPeople.toNumber() : 0,
        story: assoc
            ? assocInfo[assoc.name]
                ? {
                      en: assocInfo[assoc.name].description.en,
                      es: assocInfo[assoc.name].description.es,
                  }
                : {
                      en: assoc ? assoc.description : '',
                      es: assoc ? assoc.description : '',
                  }
            : {
                  es: '',
                  en: '',
              },
        yearsOfExistence: assoc
            ? assocInfo[assoc.name]
                ? {
                      ...assocInfo[assoc.name].yearsOfExistence,
                  }
                : getAgeByBirthDate(assoc.creationDate)
            : 0,
        certifications:
            assoc && assocInfo[assoc.name]
                ? {
                      en: assocInfo[assoc.name].certifications.en,
                      es: assocInfo[assoc.name].certifications.es,
                  }
                : {
                      en: '',
                      es: '',
                  },
        regionInformation: dep
            ? depInfo[dep.name]
                ? {
                      en: depInfo[dep.name].description.en,
                      es: depInfo[dep.name].description.es,
                  }
                : {
                      en: dep.description,
                      es: dep.description,
                  }
            : {
                  en: '',
                  es: '',
              },
    };

    association.producers.forEach((prod) => {
        if (new Date().getFullYear() - prod.birthYear < 30)
            assocDetails.nrOfYoungPeople++;
        if (prod.gender === 'female') assocDetails.nrOfWomen++;
    });

    const batchDetails: CertificationBatchDetails = {
        code: batchInfo.code,
        cocoaType: batchInfo.fermentationPhase
            ? batchInfo.fermentationPhase.cocoaType
            : '',
        totalNetWeight: batchInfo.storage
            ? batchInfo.storage.netWeight.toNumber()
            : undefined,
        processingDate: batchInfo.storage
            ? batchInfo.storage.dayEntry.toISOString()
            : undefined,
        humidityPercentage: batchInfo.fermentationPhase
            ? batchInfo.fermentationPhase.humidity.toNumber()
            : undefined,
        grainIndex: batchInfo.storage
            ? batchInfo.storage.grainIndex.toNumber()
            : undefined,
        fermentationDays: batchInfo.fermentationPhase
            ? batchInfo.fermentationPhase.totalDays.toNumber()
            : undefined,
        fermentationModel: '',
        conversionFactor: batchInfo.storage
            ? batchInfo.storage.conversionFaction.toString()
            : '',
        score: batchInfo.storage ? batchInfo.storage.score : undefined,
        sensoryProfile: assoc
            ? assocInfo[assoc.name]
                ? {
                      en: assocInfo[assoc.name].sensoryProfile.en,
                      es: assocInfo[assoc.name].sensoryProfile.es,
                  }
                : {
                      en: assoc ? assoc.sensoryProfile : '',
                      es: assoc ? assoc.sensoryProfile : '',
                  }
            : {
                  es: '',
                  en: '',
              },
    };
    const producers: CertificationProducersInfo = {
        haCocoa: 0,
        haConservationForest: 0,
        identifiedVarieties: '',
        nrMen: 0,
        nrWomen: 0,
    };

    const identifiedVarieties: string[] = [];

    batchProducers.forEach((prod) => {
        producers.haCocoa += prod.nrCocoaHa.toNumber();
        producers.haConservationForest += prod.nrForestHa.toNumber();
        if (prod.gender === 'male') producers.nrMen++;
        else producers.nrWomen++;
        // Split the each producer's wildlife collection into separate varieties
        const prodWildlifeVarieties = prod.wildlife.split(' ');
        // Check each variety if it exists.
        prodWildlifeVarieties.forEach((prodVariety) => {
            if (
                prodVariety &&
                !identifiedVarieties.find((variety) => variety === prodVariety)
            ) {
                identifiedVarieties.push(prodVariety);
            }
        });
    });
    producers.identifiedVarieties = identifiedVarieties.join(', ');

    const harvesting: CertificationHarvestingInfo = {
        date: batchInfo.pulpsUsed
            ? batchInfo.pulpsUsed[0]
                ? batchInfo.pulpsUsed[0].pulp.collectionDate.toISOString()
                : undefined
            : undefined,
        pricePerKgCocoaPulp: batchInfo.pulpsUsed
            ? batchInfo.pulpsUsed[0]
                ? batchInfo.pulpsUsed[0].pulp.pricePerKg.toNumber()
                : undefined
            : undefined,
    };

    const fermentation: CertificationFermentationInfo = {
        startDate: batchInfo.fermentationPhase
            ? batchInfo.fermentationPhase.startDate.toISOString()
            : undefined,
        genetics: batchInfo.fermentationPhase
            ? batchInfo.fermentationPhase.genetics
            : '',
        netWeight: batchInfo.fermentationPhase
            ? batchInfo.fermentationPhase.weight.toNumber()
            : undefined,
        hoursDrained: batchInfo.fermentationPhase
            ? batchInfo.fermentationPhase.hoursDrained.toNumber()
            : undefined,
        bxDegrees: batchInfo.fermentationPhase
            ? batchInfo.fermentationPhase.brixDegrees.toNumber()
            : undefined,
        nrOfFlips: batchInfo.fermentationPhase
            ? batchInfo.fermentationPhase.flips.length
            : undefined,
        days: batchInfo.fermentationPhase
            ? batchInfo.fermentationPhase.totalDays.toNumber()
            : undefined,
        flips: batchInfo.fermentationPhase
            ? batchInfo.fermentationPhase.flips.map((flip) => {
                  return flip as Flip;
              })
            : [],
        dailyReports: batchInfo.fermentationPhase
            ? batchInfo.fermentationPhase.dailyReports.map((report) => {
                  return report as DayReport;
              })
            : [],
    };
    const drying: CertificationDryingInfo = {
        startDate: batchInfo.dryingPhase
            ? batchInfo.dryingPhase.startDate.toISOString()
            : undefined,
        nrOfDays: batchInfo.dryingPhase
            ? batchInfo.dryingPhase.totalDryingDays
            : undefined,
        finalHumidity: batchInfo.dryingPhase
            ? batchInfo.dryingPhase.finalGrainHumidity
            : undefined,
    };
    const storage: CertificationStorageInfo = {
        startDate: batchInfo.storage
            ? batchInfo.storage.dayEntry.toISOString()
            : undefined,
        batchNetWeight: batchInfo.storage
            ? batchInfo.storage.netWeight.toNumber()
            : undefined,
        conversionFactor: batchInfo.storage
            ? batchInfo.storage.conversionFaction.toString()
            : '',
        fermentationPercentage: batchInfo.storage
            ? batchInfo.storage.fermentationPercentage.toNumber()
            : undefined,
        grainIndex: batchInfo.storage
            ? batchInfo.storage.grainIndex.toString()
            : '',
    };
    const sales: CertificationSaleInfo = {
        buyer: batchInfo.sale ? batchInfo.sale.buyer : '',
        negotiationTerm: batchInfo.sale ? batchInfo.sale.negotiationTerm : '',
        pricePerKg: batchInfo.sale ? batchInfo.sale.pricePerKg : undefined,
        lot: batchInfo.sale ? batchInfo.sale.lotCode : '',
        country: batchInfo.sale ? batchInfo.sale.destination : '',
        negotiationDate: batchInfo.sale
            ? batchInfo.sale.negotiationDate.toISOString()
            : undefined,
    };

    return {
        assocDetails,
        batchDetails,
        traceDetails: {
            producers,
            harvesting,
            fermentation,
            drying,
            storage,
            sales,
        },
    };
};

/**
 *
 * Fetches a batch by its code.
 *
 * @param {string} code Batch Code.
 */
export const getBatchByCode = (code: string) => {
    return prisma.batch.findUnique({
        where: { code },
        include: {
            sale: true,
            storage: true,
            dryingPhase: true,
            fermentationPhase: true,
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
 * Checks if a batch with the given code exists.
 *
 * @param {string} code Batch Code to filter for.
 * @returns {Promise<boolean>}
 */
export const checkBatchExistsByCode = async (
    code: string
): Promise<boolean> => {
    const batch = await prisma.batch.findUnique({ where: { code } });

    return batch !== null;
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
                    fermentationPhase: {
                        NOT: undefined,
                    },
                },
                {
                    dryingPhase: {
                        NOT: undefined,
                    },
                },
                {
                    storage: {
                        NOT: undefined,
                    },
                },
                {
                    pulpsUsed: {
                        every: {
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
                {
                    sale: internationallySold
                        ? { negotiation: 'international' }
                        : sold
                        ? { isNot: null }
                        : null,
                },
            ],
        },
        include: {
            sale: true,
            storage: true,
            fermentationPhase: true,
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
                    fermentationPhase: {
                        NOT: undefined,
                    },
                },
                {
                    dryingPhase: {
                        NOT: undefined,
                    },
                },
                {
                    storage: {
                        NOT: undefined,
                    },
                },
                {
                    pulpsUsed: {
                        every: {
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
                {
                    sale: internationallySold
                        ? { negotiation: 'international' }
                        : sold
                        ? { isNot: null }
                        : null,
                },
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
 * Adds a flip report to the fermentation phase of a batch.
 *
 * @param fermentationId Id of the fermentation phase.
 * @param flip Flip Details.
 * @returns {Promise<FermentationPhase>}
 */
export const addBatchFermentationFlip = async (
    fermentationId: number,
    flip: Flip
): Promise<FermentationPhase> => {
    const fermentationPhase = await prisma.fermentationPhase.findUnique({
        where: { id: fermentationId },
        select: { flips: true },
    });

    const flips: Flip[] = fermentationPhase.flips.map((jsonFlip) => {
        return {
            type: jsonFlip['type'],
            time: jsonFlip['time'],
            temp: jsonFlip['temp'],
            ambient: jsonFlip['ambient'],
            humidity: jsonFlip['humidity'],
        };
    });

    flips.push(flip);

    flips.sort((a, b) => a.time - b.time);

    return prisma.fermentationPhase.update({
        where: { id: fermentationId },
        data: {
            flips,
        },
    });
};

/**
 *
 * Adds a day report to the fermentation phase of a batch.
 *
 * @param fermentationId Id of the fermentation phase.
 * @param flip Day Report Details.
 * @returns {Promise<FermentationPhase>}
 */
export const addBatchFermentationDayReport = async (
    fermentationId: number,
    dayReport: DayReport
) => {
    const fermentationPhase = await prisma.fermentationPhase.findUnique({
        where: { id: fermentationId },
        select: { dailyReports: true },
    });

    const dailyReports: DayReport[] = fermentationPhase.dailyReports.map(
        (jsonDailyReport) => {
            return {
                temperatureMass: jsonDailyReport['temperatureMass'],
                phMass: jsonDailyReport['phMass'],
                phCotiledon: jsonDailyReport['phCotiledon'],
            };
        }
    );

    dailyReports.push(dayReport);

    return prisma.fermentationPhase.update({
        where: { id: fermentationId },
        data: {
            dailyReports,
        },
    });
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

/**
 *
 * Updates the details of a batch fermentation phase flip.
 *
 * @param fermentationId Id of the Fermentation Phase.
 * @param flipIndex Index of the Flip.
 * @param flip New Flip Details.
 * @returns {Promise<FermentationPhase>}
 */
export const updateBatchFermentationFlip = async (
    fermentationId: number,
    flipIndex: number,
    flip: FlipUpdate
): Promise<FermentationPhase> => {
    const fermentationPhase = await prisma.fermentationPhase.findUnique({
        where: {
            id: fermentationId,
        },
    });

    const flips: Flip[] = fermentationPhase.flips.map((jsonFlip) => {
        return {
            type: jsonFlip['type'],
            time: jsonFlip['time'],
            temp: jsonFlip['temp'],
            ambient: jsonFlip['ambient'],
            humidity: jsonFlip['humidity'],
        };
    });

    if (!flips[flipIndex]) {
        throw new ApiError(
            404,
            APP_CONSTANTS.RESPONSE.FERMENTATION.FLIP.NOT_FOUND
        );
    }

    flips[flipIndex] = {
        ...flips[flipIndex],
        ...flip,
    };

    return await prisma.fermentationPhase.update({
        where: { id: fermentationId },
        data: {
            flips,
        },
    });
};

/**
 *
 * Updates the details of a batch fermentation phase day report.
 *
 * @param fermentationId Id of the Fermentation Phase.
 * @param dayIndex Index of the day.
 * @param dayReport New Day Report Details.
 * @returns {Promise<FermentationPhase>}
 */
export const updateBatchFermentationDayReport = async (
    fermentationId: number,
    dayIndex: number,
    dayReport: DayReportUpdate
): Promise<FermentationPhase> => {
    const fermentationPhase = await prisma.fermentationPhase.findUnique({
        where: {
            id: fermentationId,
        },
    });

    const dailyReports: DayReport[] = fermentationPhase.dailyReports.map(
        (jsonDayReport) => {
            return {
                day: jsonDayReport['day'],
                temperatureMass: jsonDayReport['temperatureMass'],
                phMass: jsonDayReport['phMass'],
                phCotiledon: jsonDayReport['phCotiledon'],
            };
        }
    );

    if (!dailyReports[dayIndex]) {
        throw new ApiError(
            404,
            APP_CONSTANTS.RESPONSE.FERMENTATION.DAY_REPORT.NOT_FOUND
        );
    }

    dailyReports[dayIndex] = {
        ...dailyReports[dayIndex],
        ...dayReport,
    };

    return await prisma.fermentationPhase.update({
        where: { id: fermentationId },
        data: {
            dailyReports,
        },
    });
};

/**
 *
 * Removes a set of flip details from the fermentaion phase of a batch.
 *
 * @param fermentationId Id of the Fermentation Phase.
 * @param flipIndex Index of the Flip.
 * @returns {Promise<FermentationPhase>}
 */
export const removeBatchFermentationFlip = async (
    fermentationId: number,
    flipIndex: number
): Promise<FermentationPhase> => {
    const { flips } = await prisma.fermentationPhase.findUnique({
        where: {
            id: fermentationId,
        },
        select: {
            flips: true,
        },
    });

    if (flips[flipIndex]) {
        flips.splice(flipIndex, 1);
        return await prisma.fermentationPhase.update({
            where: {
                id: fermentationId,
            },
            data: {
                flips,
            },
        });
    } else {
        throw new ApiError(
            404,
            APP_CONSTANTS.RESPONSE.FERMENTATION.FLIP.NOT_FOUND
        );
    }
};

/**
 *
 * Removes a set of day report details from the fermentaion phase of a batch.
 *
 * @param fermentationId Id of the Fermentation Phase.
 * @param dayIndex Index of the Day.
 * @returns {Promise<FermentationPhase>}
 */
export const removeBatchFermentationDayReport = async (
    fermentationId: number,
    dayIndex: number
): Promise<FermentationPhase> => {
    const { dailyReports } = await prisma.fermentationPhase.findUnique({
        where: {
            id: fermentationId,
        },
        select: {
            dailyReports: true,
        },
    });

    if (dailyReports[dayIndex]) {
        dailyReports.splice(dayIndex, 1);
        return await prisma.fermentationPhase.update({
            where: {
                id: fermentationId,
            },
            data: {
                dailyReports,
            },
        });
    } else {
        throw new ApiError(
            404,
            APP_CONSTANTS.RESPONSE.FERMENTATION.DAY_REPORT.NOT_FOUND
        );
    }
};
