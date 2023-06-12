import { ODK } from '@/config';
import { prisma } from '@/db';
import { odkAPI } from '@/plugins/axios';
import {
    DryingPhase,
    FermentationPhase,
    Prisma,
    Producer,
    Pulp,
    Sale,
    Storage,
} from '@prisma/client';
import { AxiosResponse } from 'axios';
import JSZip from 'jszip';

import { groupArrayOfObjectsByProp } from '@/utils/methods/arrays';
import { stringIsValidDate } from '@/utils/methods/date';
import { convertStringToDate } from '@/utils/methods/dates';
import {
    convertStringToDecimal,
    convertStringToNumber,
} from '@/utils/methods/numbers';
import {
    parseCollectionFormSubmissions,
    parseDryingFormSubmissions,
    parseFermentationFormSubmissions,
    parseFermentationPHFormSubmissions,
    parseFermentationVolteoFormSubmissions,
    parseProductionFormSubmissions,
    parseSalesFormSubmissions,
    parseStorageFormSubmissions,
} from '@/utils/methods/odkParsers';
import { AuroraFormID } from '@/utils/types/odk/forms';

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
    const response: AxiosResponse<ArrayBuffer> = await odkAPI.get<ArrayBuffer>(
        `/v1/projects/${projectId}/forms/${formId}/submissions.csv.zip?attachments=false&groupPaths=true&deletedFields=false&splitSelectMultiples=true`,
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
 * SeedsProducers Information from the Producer Submission Form
 */
export const seedProducersFormData = async () => {
    const csvFiles = await getODKFormSubmissionCSVFileContents('A-Productor');

    const entries = parseProductionFormSubmissions(csvFiles[0]);

    // For each entry
    for (let i = 0; i < entries.length; i++) {
        // We can't seed producers without a code.
        if (!entries[i]['a-producer_code']) continue;

        const codeTaken = await prisma.producer.findUnique({
            where: {
                code: entries[i]['a-producer_code'],
            },
        });
        // Check first if the producer exists with that code
        if (!codeTaken) {
            // seed associations if these do not exist
            let association = await prisma.association.findUnique({
                where: {
                    name: entries[i]['a-association'],
                },
            });
            if (!association) {
                association = await prisma.association.create({
                    data: {
                        name: entries[i]['a-association'],
                        creationDate: new Date(),
                        description: '',
                        nrOfAssociates: 1,
                    },
                });
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
            // seed

            const producerAge = parseInt(entries[i]['a-age']);

            const producerData: Omit<Producer, 'id'> = {
                code: entries[i]['a-producer_code'],
                firstName: entries[i].farmer_first_name ?? '',
                lastName: entries[i].farmer_last_name ?? '',
                phoneNumber: entries[i].phone_number ?? '',
                gender: entries[i]['a-resp_gender'] ?? '',
                birthYear: isNaN(producerAge)
                    ? new Date().getFullYear()
                    : new Date().getFullYear() - producerAge,
                municipiality: entries[i]['a-town'],
                village: entries[i]['a-village_name'] ?? '',
                idDepartment: department.id,
                idAssociation: association.id,
                farmName: entries[i]['a-farm_name'] ?? '',
                location: '',
                nrOfHa: convertStringToDecimal(entries[i]['a-total_area']),
                nrCocoaHa: convertStringToDecimal(entries[i]['a-cacao_area']),
                nrForestHa: convertStringToDecimal(
                    entries[i]['a-protected_area']
                ),
                nrCocoaLots: convertStringToDecimal(
                    entries[i]['a-lots_r_count']
                ),
                nrWaterSources: convertStringToDecimal(
                    entries[i]['a-water_sources_num']
                ),
                wildlife: entries[i]['a-animal'],
            };

            await prisma.producer.create({
                data: producerData,
            });
        }
    }
};

/**
 * Seeds Pulp Collection Information from the Pulp Collection Submission Form
 */
export const seedCollectionFormData = async () => {
    const csvFiles = await getODKFormSubmissionCSVFileContents('B-Recolección');

    const entries = parseCollectionFormSubmissions(csvFiles[0]);

    for (let i = 0; i < entries.length; i++) {
        if (!entries[i].prod_code) continue;

        const producer = await prisma.producer.findUnique({
            where: { code: entries[i].prod_code },
        });

        if (!producer) continue;

        const batchWeightCCN = convertStringToDecimal(
            entries[i].batch_net_weight_CCN
        ).toNumber();
        const batchWeightARO = convertStringToDecimal(
            entries[i].batch_net_weight_aromatic
        ).toNumber();
        const batchWeightHYB = convertStringToDecimal(
            entries[i].batch_net_weight_hybrid
        ).toNumber();
        const batchWeightUNK = convertStringToDecimal(
            entries[i].batch_net_weight_unknown
        ).toNumber();

        const pulpData: Omit<Pulp, 'id'> = {
            codeProducer: entries[i].prod_code,
            collectionDate: stringIsValidDate(entries[i].collection_date)
                ? new Date(entries[i].collection_date)
                : new Date(),
            quality: entries[i].batch_quality,
            status: entries[i].batch_status,
            genetics: 'mixed',
            totalPulpKg: new Prisma.Decimal(
                batchWeightCCN +
                    batchWeightARO +
                    batchWeightHYB +
                    batchWeightUNK
            ),
            pricePerKg: convertStringToDecimal(entries[i].batch_kg_price),
            totalPrice: convertStringToDecimal(entries[i].batch_total_price),
        };

        await prisma.pulp.create({
            data: pulpData,
        });
    }
};

/**
 * Seeds Fermentation Phase Information from the Fermentation Submission Form
 */
export const seedFermentationFormData = async () => {
    const csvFiles = await getODKFormSubmissionCSVFileContents(
        'C-Fermentación'
    );

    const entries = parseFermentationFormSubmissions(csvFiles[0]);

    for (let i = 0; i < entries.length; i++) {
        if (!entries[i].batch_code) continue;
        const batch = await prisma.batch.findUnique({
            where: {
                code: entries[i].batch_code,
            },
            include: {
                fermentationPhase: true,
            },
        });
        // Check if this batch exists or if fermentation was seeded for this batch.
        if (!batch || batch.fermentationPhase) continue;

        const fermentationPhaseEntries: Omit<FermentationPhase, 'id'> = {
            cocoaType: entries[i].cacao_type,
            startDate: convertStringToDate(entries[i].ferm_start_date),
            genetics: entries[i].genetics,
            weight: convertStringToDecimal(entries[i].batch_weight),
            brixDegrees: convertStringToDecimal(entries[i].brix_degrees),
            humidity: convertStringToDecimal(entries[i].flip_humidity),
            hoursDrained: convertStringToDecimal(entries[i].hours_drained),
            nrFlips: new Prisma.Decimal(0),
            totalDays: new Prisma.Decimal(0),
            codeBatch: entries[i].batch_code,
            flips: [],
            dailyReports: [],
        };

        await prisma.fermentationPhase.create({
            data: fermentationPhaseEntries,
        });
    }
};

/**
 * Adds Fermentation Daily Reports from the Fermentation PH Submission Form
 */
export const seedFermentationPHFormData = async () => {
    const csvFiles = await getODKFormSubmissionCSVFileContents(
        'C-Fermentación-PH'
    );
    const entries = parseFermentationPHFormSubmissions(csvFiles[0]);
    const batchEntries = groupArrayOfObjectsByProp(entries, 'batch_code');
    const batchKeys = Object.keys(batchEntries);
    const seededReports = [];
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

        const result = await prisma.fermentationPhase.update({
            where: {
                codeBatch: batchKeys[index],
            },
            data: {
                dailyReports: reports.map((report) => {
                    return {
                        temperatureMass: convertStringToNumber(
                            report.mass_temperature
                        ),
                        phMass: convertStringToNumber(report.mass),
                        phCotiledon: convertStringToNumber(report.ph_cotiledom),
                    };
                }),
            },
        });

        seededReports.push(result);
    }
    return seededReports;
};

/**
 * Adds Fermentation Flips from the Fermentation Volteo Submission Form
 */
export const seedFermentationFlipsFormData = async () => {
    const csvFiles = await getODKFormSubmissionCSVFileContents(
        'C-Fermentación-Volteo'
    );
    const entries = parseFermentationVolteoFormSubmissions(csvFiles[0]);
    const batchEntries = groupArrayOfObjectsByProp(entries, 'batch_code');
    const batchKeys = Object.keys(batchEntries);

    const seededFlips = [];

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

        const result = await prisma.fermentationPhase.update({
            where: {
                codeBatch: batchKeys[index],
            },
            data: {
                flips: flips.map((flip) => {
                    return {
                        type: 'time',
                        time: convertStringToNumber(flip.flip_time),
                        temp: convertStringToNumber(flip.flip_temp),
                        ambient: convertStringToNumber(flip.flip_ambient),
                        humidity: convertStringToNumber(flip.flip_humidity),
                    };
                }),
            },
        });

        seededFlips.push(result);
    }

    return seededFlips;
};

/**
 * Seeds Drying Phase Information from the Drying Submission Form
 */
export const seedDryingFormData = async () => {
    const csvFiles = await getODKFormSubmissionCSVFileContents('D-Secado');

    const entries = parseDryingFormSubmissions(csvFiles[0]);
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

        const dryingPhaseData: Omit<DryingPhase, 'id'> = {
            startDate: convertStringToDate(entries[i].dry_start_date),
            endDate: convertStringToDate(entries[i].dry_end_date),
            totalDryingDays: isNaN(parseInt(entries[i].dry_end_date))
                ? 0
                : parseInt(entries[i].dry_end_date),
            finalGrainHumidity: parseInt(entries[i].moisture_final),
            codeBatch: entries[i].batch_code,
        };

        await prisma.dryingPhase.create({
            data: dryingPhaseData,
        });
    }
};

/**
 * Seeds Storage Phase Information from the Storage Submission Form
 */
export const seedStorageFormData = async () => {
    const csvFiles = await getODKFormSubmissionCSVFileContents(
        'E-Almacenamiento'
    );

    const entries = parseStorageFormSubmissions(csvFiles[0]);

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
            score: convertStringToDecimal(entries[i].sensorial_score),
            codeBatch: entries[i].batch_code,
        };

        await prisma.storage.create({
            data: storageData,
        });
    }
};

/**
 * Seeds Sales Phase Information from the Sales Submission Form
 */
export const seedSalesFormData = async () => {
    const csvFiles = await getODKFormSubmissionCSVFileContents('F-Ventas');

    const entries = parseSalesFormSubmissions(csvFiles[0]);

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

        const pricePerKg = parseInt(entries[i].val_kg);
        const totalValue = parseInt(entries[i].batch_total_price);

        const storageData: Omit<Sale, 'id'> = {
            buyer: entries[i].buyer,
            lotCode: entries[i].lot_code,
            negotiation: entries[i].nego_type,
            negotiationTerm: entries[i].nego_term,
            negotiationDate: convertStringToDate(entries[i].nego_date),
            destination: entries[i].dest_country,
            currency: entries[i].currency,
            pricePerKg: isNaN(pricePerKg) ? 0 : pricePerKg,
            totalValue: isNaN(totalValue) ? 0 : totalValue,
            codeBatch: entries[i].batch_code,
        };

        await prisma.sale.create({
            data: storageData,
        });
    }
};
