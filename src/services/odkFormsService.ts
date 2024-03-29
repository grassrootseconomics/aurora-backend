import { ODK } from '@/config';
import { prisma } from '@/db';
import { odkAPI } from '@/plugins/axios';
import {
    DryingPhase,
    FermentationPhase,
    Prisma,
    Producer,
    Pulp,
    PulpBatch,
    Sale,
    Storage,
} from '@prisma/client';
import { AxiosResponse } from 'axios';
import JSZip from 'jszip';

import { ASSOCIATION_CODE_TO_NAME } from '@/utils/constants';
import { groupArrayOfObjectsByProp } from '@/utils/methods/arrays';
import { stringIsValidDate } from '@/utils/methods/date';
import {
    convertStringToDate,
    getNrOfDaysBetweenDates,
} from '@/utils/methods/dates';
import {
    convertStringToDecimal,
    convertStringToNumber,
} from '@/utils/methods/numbers';
import { parseCSVFileToJSONArray } from '@/utils/methods/odkParsers';
import {
    AuroraAProductorForm,
    AuroraBColeccionForm,
    AuroraCFermentacionForm,
    AuroraCFermentacionFormPH,
    AuroraCFermentacionFormProdCodes,
    AuroraCFermentacionFormProdPulpCodes,
    AuroraCFermentacionFormVolteo, // AuroraCFermentacionProducersForm,
    AuroraDSecadoForm,
    AuroraEAlmacenamientoForm,
    AuroraFVentasForm,
    AuroraFormID,
} from '@/utils/types/odk/forms';
import { ODKSyncRateType } from '@/utils/types/odk/sync';

/**
 *
 * Constructs an oData filter for submissions.
 *
 * {@link https://learn.microsoft.com/en-us/dynamics-nav/using-filter-expressions-in-odata-uris#filter-expressions OData Filter Expressions}
 *
 * This solution does not filter submissions for current day.
 *
 * Submissions that have been submitted at a present date will be synced next week.
 *
 * @returns {string} Submission filter
 *
 * @example <caption>Example of filter</caption>
 *    year(__sytem/submissionDate) eq 2023
 */
const getSubmissionFilterForPastWeek = (): string => {
    const currentDay = new Date();

    const lastWeekDay = new Date(
        currentDay.getTime() - 1000 * 60 * 60 * 24 * 7
    );

    // Filters for submissions later than the day it was last week (including the start day).
    const lastYearCondition = `year(__system/submissionDate) eq ${lastWeekDay.getFullYear()}`;
    const lastMonthCondition = `month(__system/submissionDate) eq ${
        lastWeekDay.getMonth() + 1
    }`;
    const lastDayCondition = `day(__system/submissionDate) ge ${lastWeekDay.getDate()}`;

    // Filters for submissions earlier than today (excluding today).
    const currentYearCondition = `year(__system/submissionDate) eq ${currentDay.getFullYear()}`;
    const currentMonthCondition = `month(__system/submissionDate) eq ${
        currentDay.getMonth() + 1
    }`;
    // LT to filter for days before present
    const currentDayCondition = `day(__system/submissionDate) lt ${currentDay.getDate()}`;

    return `(${lastYearCondition} and ${lastMonthCondition} and ${lastDayCondition}) or (${currentYearCondition} and ${currentMonthCondition} and ${currentDayCondition})`;
};

/**
 *
 * Constructs an oData filter for submissions.
 *
 * {@link https://learn.microsoft.com/en-us/dynamics-nav/using-filter-expressions-in-odata-uris#filter-expressions OData Filter Expressions}
 *
 * Submissions that have been submitted at a present date will be synced next hour.
 *
 * @returns {string} Submission filter
 *
 * @example <caption>Example of filter</caption>
 *    year(__sytem/submissionDate) eq 2023
 */
const getSubmissionFilterForPastHour = (): string => {
    const currentDay = new Date();

    const lastHour = new Date(currentDay.getTime() - 1000 * 60 * 60);

    // Filters for submissions later than the day it was last week (including the start day).
    const lastYearCondition = `year(__system/submissionDate) eq ${lastHour.getFullYear()}`;
    const lastMonthCondition = `month(__system/submissionDate) eq ${
        lastHour.getMonth() + 1
    }`;
    const lastDayCondition = `day(__system/submissionDate) eq ${lastHour.getDate()}`;
    const lastHourCondition = `hour(__system/submissionDate) ge ${lastHour.getHours()}`;

    // Filters for submissions earlier than today (excluding today).
    const currentYearCondition = `year(__system/submissionDate) eq ${currentDay.getFullYear()}`;
    const currentMonthCondition = `month(__system/submissionDate) eq ${
        currentDay.getMonth() + 1
    }`;
    // LT to filter for days before present
    const currentDayCondition = `day(__system/submissionDate) eq ${currentDay.getDate()}`;
    const currentHourCondition = `hour(__system/submissionDate) lt ${currentDay.getHours()}`;

    return `(${lastYearCondition} and ${lastMonthCondition} and ${lastDayCondition} and ${lastHourCondition}) or (${currentYearCondition} and ${currentMonthCondition} and ${currentDayCondition} and ${currentHourCondition})`;
};

export const RATE_FILTERS: Record<ODKSyncRateType, () => string> = {
    HOURLY: getSubmissionFilterForPastHour,
    WEEKLY: getSubmissionFilterForPastWeek,
};

/**
 *
 * Queries the submissions endpoint for an Aurora ODK form.
 * Parameters used: project ID & form ID.
 *
 * Returns multiple csv files, depending on the submission structure.
 *
 * @param {AuroraFormID} formId Id of the form to querry for.
 * @param {string} projectId Id of the project to which the form belongs.
 * @returns
 */
export const getODKFormSubmissionCSVFileContents = async (
    formId: AuroraFormID,
    projectId?: string
): Promise<string[]> => {
    if (!projectId) projectId = ODK.PROJECT_ID;

    const filter = RATE_FILTERS[ODK.SYNC_CRON.RATE];

    const response: AxiosResponse<ArrayBuffer> = await odkAPI.get<ArrayBuffer>(
        `/v1/projects/${projectId}/forms/${formId}/submissions.csv.zip?attachments=false&groupPaths=true&deletedFields=false&splitSelectMultiples=true&$filter=${filter()}`,
        {
            responseType: 'arraybuffer',
        }
    );
    const zipData: ArrayBuffer = response.data;

    const zip: JSZip = await JSZip.loadAsync(zipData);

    const csvFiles: string[] = [];

    await Promise.all(
        zip.file(/\.csv$/i).map(async (file) => {
            const content: string = await file.async('string');
            csvFiles.push(content);
        })
    );

    return csvFiles;
};

/**
 * Seeds Producers Information from the Producer Submission Form
 */
export const seedProducersFormData = async () => {
    console.log(`Syncing producers!`);
    const csvFiles = await getODKFormSubmissionCSVFileContents('A-Productor');

    const entries: AuroraAProductorForm[] =
        parseCSVFileToJSONArray<AuroraAProductorForm>(csvFiles[0]);

    let producersSeeded = 0;
    // For each entry
    for (let i = 0; i < entries.length; i++) {
        // Check for existing producers.

        let producerCode = '';
        if (entries[i]['a-old_producer_code'].length > 0)
            producerCode = entries[i]['a-old_producer_code'];
        if (entries[i]['a-producer_code_num'])
            producerCode = entries[i]['a-producer_code_num'];

        if (producerCode) {
            // Check first if the producer exists with that code
            const codeTaken = await prisma.producer.findUnique({
                where: {
                    code: producerCode,
                },
            });
            if (codeTaken) {
                continue;
            }
        } else {
            // With no code, we check if the producers already exists by its name and association
            const producer = await prisma.producer.findFirst({
                where: {
                    AND: [
                        {
                            firstName: entries[i]['farmer_first_name'],
                            lastName: entries[i]['farmer_last_name'],
                        },
                        {
                            association: {
                                name: ASSOCIATION_CODE_TO_NAME[
                                    entries[i]['a-association']
                                ],
                            },
                        },
                    ],
                },
            });
            if (producer) {
                continue;
            }
        }
        // seed departments if these do not exist
        let department = await prisma.department.findUnique({
            where: {
                name: entries[i]['a-department'],
            },
        });
        if (!department) {
            department = await prisma.department.create({
                data: {
                    name: entries[i]['a-department'],
                    description: '',
                    nrOfAssociates: 1,
                },
            });
        }
        // seed associations if these do not exist
        let association = await prisma.association.findUnique({
            where: {
                name: ASSOCIATION_CODE_TO_NAME[entries[i]['a-association']],
            },
        });
        if (!association) {
            association = await prisma.association.create({
                data: {
                    name: entries[i]['a-association'],
                    creationDate: new Date(),
                    description: '',
                    nrOfAssociates: 1,
                    department: department.name,
                },
            });
        }

        const birthYear = convertStringToNumber(entries[i]['a-age']);
        const producerData: Omit<Producer, 'id'> = {
            code: producerCode !== '' ? producerCode : undefined,
            firstName: entries[i].farmer_first_name ?? '',
            lastName: entries[i].farmer_last_name ?? '',
            phoneNumber: entries[i].phone_number ?? '',
            gender: entries[i]['a-resp_gender'] ?? '',
            birthYear: birthYear === 0 ? new Date().getFullYear() : birthYear,
            municipiality: entries[i]['a-town'],
            village: entries[i]['a-village_name'] ?? '',
            idDepartment: department.id,
            idAssociation: association.id,
            farmName: entries[i]['a-farm_name'] ?? '',
            location: `lat:${entries[i]['a-gpsloc-Latitude'] ?? ''}, lon:${
                entries[i]['a-gpsloc-Longitude'] ?? ''
            }, alt: ${entries[i]['a-gpsloc-Altitude'] ?? ''}, acc:${
                entries[i]['a-gpsloc-Accuracy'] ?? ''
            }`,
            nrOfHa: convertStringToDecimal(entries[i]['a-total_area']),
            nrCocoaHa: convertStringToDecimal(entries[i]['a-cacao_area']),
            nrForestHa: convertStringToDecimal(entries[i]['a-protected_area']),
            nrCocoaLots: convertStringToDecimal(entries[i]['a-lots_r_count']),
            nrWaterSources: convertStringToDecimal(
                entries[i]['a-water_sources_num']
            ),
            wildlife: entries[i]['a-animal'],
        };
        try {
            // Add producer
            await prisma.producer.create({
                data: producerData,
            });
            producersSeeded++;
        } catch (err) {
            console.log(err);
        }
    }

    console.log(`Successfully seeded ${producersSeeded} producers!`);
};

/**
 * Seeds Pulp Collection Information from the Pulp Collection Submission Form
 */
export const seedCollectionFormData = async () => {
    console.log(`Syncing pulps!`);
    const csvFiles = await getODKFormSubmissionCSVFileContents('B-Recolección');

    const entries = parseCSVFileToJSONArray<AuroraBColeccionForm>(csvFiles[0]);

    let pulpsSeeded = 0;
    for (let i = 0; i < entries.length; i++) {
        if (!entries[i].prod_code) continue;

        const producer = await prisma.producer.findUnique({
            where: { code: entries[i].prod_code },
        });

        if (!producer) continue;

        const pulps: Omit<Pulp, 'id'>[] = [];
        if (entries[i].pulp_code_mez) {
            const existingPulp = await prisma.pulp.findUnique({
                where: {
                    code: entries[i].pulp_code_mez,
                },
            });

            if (!existingPulp) {
                pulpsSeeded++;
                pulps.push({
                    codeProducer: entries[i].prod_code,
                    code: entries[i].pulp_code_mez,
                    collectionDate: stringIsValidDate(
                        entries[i].collection_date
                    )
                        ? new Date(entries[i].collection_date)
                        : new Date(),
                    quality: entries[i].batch_quality_mixed,
                    status: entries[i].batch_status_mixed,
                    genetics: 'mixed',
                    totalPulpKg: convertStringToDecimal(
                        entries[i].batch_weight_mixed
                    ),
                    pricePerKg: convertStringToDecimal(
                        entries[i].batch_kg_price
                    ),
                    totalPrice: convertStringToDecimal(
                        entries[i].batch_total_price
                    ),
                });
            }
        }
        if (entries[i].pulp_code_arm) {
            const existingPulp = await prisma.pulp.findUnique({
                where: {
                    code: entries[i].pulp_code_arm,
                },
            });

            if (!existingPulp) {
                pulpsSeeded++;
                pulps.push({
                    codeProducer: entries[i].prod_code,
                    code: entries[i].pulp_code_arm,
                    collectionDate: stringIsValidDate(
                        entries[i].collection_date
                    )
                        ? new Date(entries[i].collection_date)
                        : new Date(),
                    quality: entries[i].batch_quality_aromatic,
                    status: entries[i].batch_status_aromatic,
                    genetics: 'aromatic',
                    totalPulpKg: convertStringToDecimal(
                        entries[i].batch_weight_aromatic
                    ),
                    pricePerKg: convertStringToDecimal(
                        entries[i].batch_kg_price
                    ),
                    totalPrice: convertStringToDecimal(
                        entries[i].batch_total_price
                    ),
                });
            }
        }
        if (entries[i].pulp_code_hbr) {
            const existingPulp = await prisma.pulp.findUnique({
                where: {
                    code: entries[i].pulp_code_hbr,
                },
            });

            if (!existingPulp) {
                pulpsSeeded++;
                pulps.push({
                    codeProducer: entries[i].prod_code,
                    code: entries[i].pulp_code_hbr,
                    collectionDate: stringIsValidDate(
                        entries[i].collection_date
                    )
                        ? new Date(entries[i].collection_date)
                        : new Date(),
                    quality: entries[i].batch_quality_hybrid,
                    status: entries[i].batch_status_hybrid,
                    genetics: 'hybrid',
                    totalPulpKg: convertStringToDecimal(
                        entries[i].batch_weight_hybrid
                    ),
                    pricePerKg: convertStringToDecimal(
                        entries[i].batch_kg_price
                    ),
                    totalPrice: convertStringToDecimal(
                        entries[i].batch_total_price
                    ),
                });
            }
        }
        if (entries[i].pulp_code_ccn) {
            const existingPulp = await prisma.pulp.findUnique({
                where: {
                    code: entries[i].pulp_code_ccn,
                },
            });

            if (!existingPulp) {
                pulpsSeeded++;
                pulps.push({
                    codeProducer: entries[i].prod_code,
                    code: entries[i].pulp_code_ccn,
                    collectionDate: stringIsValidDate(
                        entries[i].collection_date
                    )
                        ? new Date(entries[i].collection_date)
                        : new Date(),
                    quality: entries[i].batch_quality_ccn,
                    status: entries[i].batch_statust_ccn,
                    genetics: 'CCN-TSH',
                    totalPulpKg: convertStringToDecimal(
                        entries[i].batch_weight_ccn
                    ),
                    pricePerKg: convertStringToDecimal(
                        entries[i].batch_kg_price
                    ),
                    totalPrice: convertStringToDecimal(
                        entries[i].batch_total_price
                    ),
                });
            }
        }
        try {
            await prisma.pulp.createMany({
                data: pulps,
            });
        } catch (err) {
            console.log(err);
        }
    }

    console.log(`Successfully seeded ${pulpsSeeded} pulps!`);
};

/**
 * Seeds Fermentation Phase Information from the Fermentation Submission Form
 */
export const seedFermentationFormData = async () => {
    console.log(`Syncing fermentation phases!`);
    const csvFiles = await getODKFormSubmissionCSVFileContents(
        'C-Fermentación'
    );
    const entries = parseCSVFileToJSONArray<AuroraCFermentacionForm>(
        csvFiles[0]
    );
    const producerEntries =
        parseCSVFileToJSONArray<AuroraCFermentacionFormProdCodes>(csvFiles[1]);
    const pulpEntries =
        parseCSVFileToJSONArray<AuroraCFermentacionFormProdPulpCodes>(
            csvFiles[2]
        );

    let fermentationSeeded = 0;

    // Go through each entry
    // Loop through each producer and get the ones that helped this fermentation
    // Also attach each pulp contributed by each producer
    // Check if the producer code exists and the producer exists
    // Check if the pulps exists
    // Create the batch
    // Create the fermentation phase
    // Save the pulpBatch connection
    for (let i = 0; i < entries.length; i++) {
        const batch = await prisma.batch.findUnique({
            where: {
                code: entries[i].batch_code,
            },
            include: {
                fermentationPhase: true,
            },
        });

        if (batch && batch.fermentationPhase) continue;

        const producers = producerEntries
            .filter((entry) => entry['PARENT_KEY'] === entries[i].KEY)
            .map((entry) => entry['prod_code']);

        const producerPulps = await prisma.pulp.findMany({
            where: {
                codeProducer: {
                    in: producers,
                },
            },
        });

        // Create the batch
        const pulpsUsed: Omit<PulpBatch, 'id'>[] = [];

        const fermentationPulpCodes = pulpEntries
            .filter((entry) => entry['PARENT_KEY'] === entries[i].KEY)
            .map((entry) => entry['pulp_codes']);

        producerPulps.forEach((pulp) => {
            if (fermentationPulpCodes.includes(pulp.code))
                pulpsUsed.push({
                    codeBatch: entries[i].batch_code,
                    idPulp: pulp.id,
                });
        });

        await prisma.batch.create({
            data: {
                code: entries[i].batch_code,
            },
        });

        // Link pulps with batches.
        await prisma.pulpBatch.createMany({
            data: [...pulpsUsed],
        });

        // Create the fermentation phase and link with batch.
        const fermentationPhaseEntries: Omit<FermentationPhase, 'id'> = {
            cocoaType: entries[i].cacao_type,
            startDate: convertStringToDate(entries[i].ferm_start_date),
            genetics: entries[i].genetics,
            weight: convertStringToDecimal(entries[i].batch_weight),
            brixDegrees: convertStringToDecimal(entries[i].brix_degrees),
            humidity: convertStringToDecimal(entries[i].flip_humidity),
            hoursDrained: convertStringToDecimal(entries[i].hours_drained),
            initialTemp: convertStringToDecimal(entries[i].inital_temp),
            roomTemp: convertStringToDecimal(entries[i].flip_ambient),
            nrFlips: new Prisma.Decimal(0),
            totalDays: new Prisma.Decimal(0),
            codeBatch: entries[i].batch_code,
            flips: [],
            dailyReports: [],
        };
        try {
            await prisma.fermentationPhase.create({
                data: fermentationPhaseEntries,
            });
            fermentationSeeded++;
        } catch (err) {
            console.log(err);
        }
    }
    console.log(
        `Successfully seeded ${fermentationSeeded} fermentation phases and batches!`
    );
};

/**
 * Adds Fermentation Daily Reports from the Fermentation PH Submission Form
 */
export const seedFermentationPHFormData = async () => {
    console.log(`Syncing fermentation phase reports!`);
    const csvFiles = await getODKFormSubmissionCSVFileContents(
        'C-Fermentación-PH'
    );
    const entries = parseCSVFileToJSONArray<AuroraCFermentacionFormPH>(
        csvFiles[0]
    );
    const batchEntries = groupArrayOfObjectsByProp(entries, 'batch_code');
    const batchKeys = Object.keys(batchEntries);

    let updatedFermentationPhases = 0;
    for (let index = 0; index < batchKeys.length; index++) {
        const batch = await prisma.batch.findUnique({
            where: {
                code: batchKeys[index],
            },
            include: {
                fermentationPhase: true,
            },
        });
        // Check if this batch exists or if drying phase was seeded for this batch.
        if (
            !batch ||
            !batch.fermentationPhase ||
            batch.fermentationPhase.dailyReports.length > 0
        )
            continue;

        const reports = batchEntries[batchKeys[index]].sort((a, b) => {
            return (
                new Date(a.meassure_time).getTime() -
                new Date(b.meassure_time).getTime()
            );
        });

        const firstReport = convertStringToDate(reports[0].meassure_time);
        const lastReport = convertStringToDate(
            reports[reports.length - 1].meassure_time
        );

        const totalDays = getNrOfDaysBetweenDates(lastReport, firstReport);
        try {
            await prisma.fermentationPhase.update({
                where: {
                    codeBatch: batchKeys[index],
                },
                data: {
                    totalDays,
                    dailyReports: reports.map((report) => {
                        return {
                            temperatureMass: convertStringToNumber(
                                report.mass_temperature
                            ),
                            phMass: convertStringToNumber(report.mass),
                            phCotiledon: convertStringToNumber(
                                report.ph_cotiledom
                            ),
                        };
                    }),
                },
            });
            updatedFermentationPhases++;
        } catch (err) {
            console.log(err);
        }
    }

    console.log(
        `Successfully updated ${updatedFermentationPhases} fermentation phases!`
    );
};

/**
 * Adds Fermentation Flips from the Fermentation Volteo Submission Form
 */
export const seedFermentationFlipsFormData = async () => {
    console.log(`Syncing fermentation phase flips!`);
    const csvFiles = await getODKFormSubmissionCSVFileContents(
        'C-Fermentación-Volteo'
    );
    const entries = parseCSVFileToJSONArray<AuroraCFermentacionFormVolteo>(
        csvFiles[0]
    );
    const batchEntries = groupArrayOfObjectsByProp(entries, 'batch_code');
    const batchKeys = Object.keys(batchEntries);

    let updatedFermentationPhases = 0;

    for (let index = 0; index < batchKeys.length; index++) {
        const batch = await prisma.batch.findUnique({
            where: {
                code: batchKeys[index],
            },
            include: {
                fermentationPhase: true,
            },
        });
        // Check if this batch exists or if drying phase was seeded for this batch.
        if (
            !batch ||
            !batch.fermentationPhase ||
            batch.fermentationPhase.flips.length > 0
        )
            continue;
        const flips = batchEntries[batchKeys[index]].sort((a, b) => {
            return (
                new Date(a.flip_time).getTime() -
                new Date(b.flip_time).getTime()
            );
        });
        const nrFlips = flips.length;
        try {
            await prisma.fermentationPhase.update({
                where: {
                    codeBatch: batchKeys[index],
                },
                data: {
                    nrFlips,
                    flips: flips.map((flip) => {
                        return {
                            type: 'time',
                            time: convertStringToNumber(flip.flip_duation),
                            temp: convertStringToNumber(flip.flip_temp),
                            ambient: convertStringToNumber(flip.flip_ambient),
                            humidity: convertStringToNumber(flip.flip_humidity),
                        };
                    }),
                },
            });
            updatedFermentationPhases++;
        } catch (err) {
            console.log(err);
        }
    }

    console.log(
        `Successfully updated ${updatedFermentationPhases} fermentation phases!`
    );
};

/**
 * Seeds Drying Phase Information from the Drying Submission Form
 */
export const seedDryingFormData = async () => {
    console.log(`Syncing drying phases!`);
    const csvFiles = await getODKFormSubmissionCSVFileContents('D-Secado');

    const entries = parseCSVFileToJSONArray<AuroraDSecadoForm>(csvFiles[0]);

    let seededDryingPhases = 0;
    for (let i = 0; i < entries.length; i++) {
        if (!entries[i].batch_code) continue;
        const batch = await prisma.batch.findUnique({
            where: {
                code: entries[i].batch_code,
            },
            include: {
                dryingPhase: true,
            },
        });
        // Check if this batch exists or if drying phase was seeded for this batch.
        if (!batch || batch.dryingPhase) continue;

        const startDate = convertStringToDate(entries[i].dry_start_date);
        const endDate = convertStringToDate(entries[i].dry_end_date);

        const dryingPhaseData: Omit<DryingPhase, 'id'> = {
            startDate,
            endDate,
            totalDryingDays: convertStringToNumber(entries[i].dry_days),
            finalGrainHumidity: convertStringToDecimal(entries[i].moisture),
            codeBatch: entries[i].batch_code,
        };

        try {
            await prisma.dryingPhase.create({
                data: dryingPhaseData,
            });
            seededDryingPhases++;
        } catch (err) {
            console.log(err);
        }
    }
    console.log(`Successfully seeded ${seededDryingPhases} drying phases!`);
};

/**
 * Seeds Storage Phase Information from the Storage Submission Form
 */
export const seedStorageFormData = async () => {
    console.log(`Syncing storage phases!`);
    const csvFiles = await getODKFormSubmissionCSVFileContents(
        'E-Almacenamiento'
    );
    const entries = parseCSVFileToJSONArray<AuroraEAlmacenamientoForm>(
        csvFiles[0]
    );

    let seededStoragePhases = 0;
    for (let i = 0; i < entries.length; i++) {
        if (!entries[i].batch_code) continue;
        const batch = await prisma.batch.findUnique({
            where: {
                code: entries[i].batch_code,
            },
            include: {
                storage: true,
            },
        });

        // Check if this batch exists or if storage was seeded for this batch.
        if (!batch || batch.storage) continue;

        const storageData: Omit<Storage, 'id'> = {
            dayEntry: convertStringToDate(entries[i].storage_date),
            netWeight: convertStringToDecimal(entries[i].weight),
            conversionFaction: convertStringToDecimal(entries[i].conversion),
            fermentationPercentage: convertStringToDecimal(
                entries[i].ferm_percent
            ),
            grainIndex: convertStringToDecimal(entries[i].grain_index),
            sensoryProfile: entries[i].sensorial,
            score: convertStringToNumber(entries[i].sensorial_score),
            codeBatch: entries[i].batch_code,
        };

        try {
            await prisma.storage.create({
                data: storageData,
            });
            seededStoragePhases++;
        } catch (err) {
            console.log(err);
        }
    }
    console.log(`Successfully seeded ${seededStoragePhases} storage phases!`);
};

/**
 * Seeds Sales Phase Information from the Sales Submission Form
 */
export const seedSalesFormData = async () => {
    console.log(`Syncing sales phases!`);
    const csvFiles = await getODKFormSubmissionCSVFileContents('F-Ventas');

    const entries = parseCSVFileToJSONArray<AuroraFVentasForm>(csvFiles[0]);

    let seededSalesPhases = 0;
    for (let i = 0; i < entries.length; i++) {
        if (!entries[i].batch_code) continue;
        const batch = await prisma.batch.findUnique({
            where: {
                code: entries[i].batch_code,
            },
            include: {
                sale: true,
            },
        });

        // Check if this batch exists or if storage was seeded for this batch.
        if (!batch || batch.sale) continue;

        const storageData: Omit<Sale, 'id'> = {
            buyer: entries[i].buyer,
            lotCode: entries[i].lot_code,
            negotiation:
                entries[i].nego_type === '0' ? 'national' : 'international',
            negotiationTerm: entries[i].nego_term,
            negotiationDate: convertStringToDate(entries[i].nego_date),
            destination: entries[i].dest_country,
            currency: entries[i].currency,
            pricePerKg: convertStringToNumber(entries[i].val_kg),
            totalValue: convertStringToNumber(entries[i].batch_total_price),
            codeBatch: entries[i].batch_code,
        };

        try {
            await prisma.sale.create({
                data: storageData,
            });
            seededSalesPhases++;
        } catch (err) {
            console.log(err);
        }
    }
    console.log(`Successfully seeded ${seededSalesPhases} sales phases!`);
};
