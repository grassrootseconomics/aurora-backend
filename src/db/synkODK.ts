import {
    seedCollectionFormData,
    seedDryingFormData,
    seedFermentationFormData,
    seedProducersFormData,
    seedSalesFormData,
    seedStorageFormData,
} from '@/services/odkFormsService';

export const syncODKForms = () => {
    console.log(`Sync Process Start: ${new Date().toISOString()}`);

    // Seed producers
    seedProducersFormData();

    // Seed batches pulps
    seedCollectionFormData();

    // Seed fermentation phases
    seedFermentationFormData();

    // Seed drying phases
    seedDryingFormData();

    // Seed storage phases
    seedStorageFormData();

    // Seed sales phases
    seedSalesFormData();

    console.log(`Sync Process End: ${new Date().toISOString()}`);
};
