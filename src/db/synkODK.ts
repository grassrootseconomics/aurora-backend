import { ODK } from '@/config';

import {
    seedCollectionFormData,
    seedDryingFormData,
    seedFermentationFlipsFormData,
    seedFermentationFormData,
    seedFermentationPHFormData,
    seedProducersFormData,
    seedSalesFormData,
    seedStorageFormData,
} from '@/services/odkFormsService';

export const syncODKForms = async () => {
    if (!ODK.API_URL) {
        console.log('Sync Process Aborted... Missing ODK API URL Param.');
    }
    if (!ODK.BASIC_AUTH_TOKEN) {
        console.log(
            'Sync Process Aborted... Missing ODK API Authentication Token.'
        );
    }
    console.log(`Sync Process Start: ${new Date().toISOString()}`);

    // Seed producers
    // Adds producers and possibly adds associations & departments.
    await seedProducersFormData();

    // Seed batches pulps
    // Adds pulps, independent from batches.
    await seedCollectionFormData();

    // Seed fermentation phases
    // Adds batches, fermentation phases and links pulps to batches.
    await seedFermentationFormData();

    // Seed Fermentation PH Form Data
    // Updates fermentation phases with ph reports
    await seedFermentationPHFormData();

    // Seed Fermentation Flips Form Data
    // Updates fermentation phases with flip reports
    await seedFermentationFlipsFormData();

    // Seed drying phases
    // Adds drying phases linked to existing batches.
    await seedDryingFormData();

    // Seed storage phases
    // Adds storage phases linked to existing batches.
    await seedStorageFormData();

    // Seed sales phases
    // Adds sales phases linked to existing batches.
    await seedSalesFormData();

    console.log(`Sync Process End: ${new Date().toISOString()}`);
};
