import { Certification } from '@prisma/client';

export type CertificationSignedLink = {
    fingerprintHash: string;
    hasSignature: string;
};

export type FromXmlCertificationSignedLink = {
    fingerprintHash: {
        _text: string;
    };
    hasSignature: {
        _text: string;
    };
};

export type CertificationAssocDetails = {
    name: string; // from assoc
    department: string; // from prod.department
    town: string; // from first producer
    nrOfAssociates: number; // form assoc
    nrOfWomen: number; // count from producers
    nrOfYoungPeople: number; // count from young people
    // assoc description
    story: {
        en: string;
        es: string;
    };
    yearsOfExistence:
        | number
        | {
              en: string;
              es: string;
          };
    // Unsure, but coudl be form assoc
    certifications: {
        en: string;
        es: string;
    };
    // from department description.
    regionInformation: {
        en: string;
        es: string;
    };
};

export type CertificationBatchDetails = {
    code: string;
    // From fermentation
    cocoaType: string;
    // From storage
    totalNetWeight: number;
    // Unsure, should
    processingDate: Date | string;
    // From drying phase
    humidityPercentage: number;
    // From storage phase
    grainIndex: number;
    // From fermentation
    fermentationDays: number;
    fermentationModel: string;
    // From Storage Phase
    conversionFactor: string;
    score: number;
    sensoryProfile: {
        en: string;
        es: string;
    };
};

export type CertificationProducersInfo = {
    haCocoa: number;
    haConservationForest: number;
    identifiedVarieties: string;
    // Count men and women
    nrMen: number;
    nrWomen: number;
};

export type CertificationHarvestingInfo = {
    // Take the earliest pulp.
    date: Date | string;
    // Make an average of this.
    pricePerKgCocoaPulp: number;
};

export type CertificationFermentationInfo = {
    startDate: Date | string;
    genetics: string;
    netWeight: number;
    hoursDrained: number;
    bxDegrees: number;
    nrOfFlips: number;
    days: number;
    flips: {
        type: string;
        time: number;
        temp: number;
        ambient: number;
        humidity: number;
    }[];
    dailyReports: {
        temperatureMass: number;
        phMass: number;
        phCotiledon: number;
    }[];
};

export type CertificationDryingInfo = {
    startDate: Date | string;
    nrOfDays: number;
    finalHumidity: number;
};

export type CertificationStorageInfo = {
    // Not sure about startDate, I have dayEntry
    // Should change it to storage_date
    startDate: Date | string;
    batchNetWeight: number;
    conversionFactor: string;
    fermentationPercentage: number;
    grainIndex: string;
};

export type CertificationSaleInfo = {
    buyer: string;
    negotiationTerm: string;
    pricePerKg: number;
    lot: string;
    country: string; //This is destiu
    negotiationDate: Date | string;
};

export type CertificationNFT = {
    assocDetails: CertificationAssocDetails;
    batchDetails: CertificationBatchDetails;
    traceDetails: {
        // Sum up from all producers
        producers: CertificationProducersInfo;
        // Everything from Pulp
        harvesting: CertificationHarvestingInfo;
        // Everything from FermentationPhase
        fermentation: CertificationFermentationInfo;
        // Everything from DryingPhase
        drying: CertificationDryingInfo;
        // Everything from StoragePhase
        storage: CertificationStorageInfo;
        // Everything from SalePhase
        sales: CertificationSaleInfo;
    };
};
