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
    await seedProducersFormData();

    // Seed batches pulps
    await seedCollectionFormData();

    // Seed fermentation phases
    await seedFermentationFormData();

    // Seed Fermentation PH Form Data
    await seedFermentationPHFormData();

    // Seed Fermentation Flips Form Data
    await seedFermentationFlipsFormData();

    // Seed drying phases
    await seedDryingFormData();

    // Seed storage phases
    await seedStorageFormData();

    // Seed sales phases
    await seedSalesFormData();

    console.log(`Sync Process End: ${new Date().toISOString()}`);
};
