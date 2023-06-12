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

export const syncODKForms = () => {
    if (!ODK.API_URL) {
        console.log('Sync Process Aborted... Missing ODK API URL Param.');
    }
    console.log(`Sync Process Start: ${new Date().toISOString()}`);

    // Seed producers
    seedProducersFormData();

    // Seed batches pulps
    seedCollectionFormData();

    // Seed fermentation phases
    seedFermentationFormData();

    // Seed Fermentation PH Form Data
    seedFermentationPHFormData();

    // Seed Fermentation Flips Form Data
    seedFermentationFlipsFormData();

    // Seed drying phases
    seedDryingFormData();

    // Seed storage phases
    seedStorageFormData();

    // Seed sales phases
    seedSalesFormData();

    console.log(`Sync Process End: ${new Date().toISOString()}`);
};
