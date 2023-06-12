import { ODK } from '@/config';
import { prisma } from '@/db';
import { odkAPI } from '@/plugins/axios';
import { DryingPhase, Prisma, Producer, Pulp, Storage } from '@prisma/client';
import { AxiosResponse } from 'axios';
import JSZip from 'jszip';

import { stringIsValidDate } from '@/utils/methods/date';
import { convertStringToDate } from '@/utils/methods/dates';
import { convertStringToDecimal } from '@/utils/methods/numbers';
import {
    parseCollectionFormSubmissions,
    parseDryingFormSubmissions,
    parseProductionFormSubmissions,
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
    console.log('Fermentation Phase Sync not yet implemented');
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
        // Check if this batch exists or if storage was seeded for this batch.
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
    console.log('Sales Sync not yet implemented');
};