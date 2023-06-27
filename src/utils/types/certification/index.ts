import { Certification } from '@prisma/client';

export type BaseCertification = Omit<
    Certification,
    'id' | 'dateSigned' | 'signedDataFingerprint' | 'key'
>;

export type CertificationNFT = {
    assocDetails: {
        name: string;
        department: string;
        town: string;
        nrOfAssociates: number;
        nrOfWomen: number;
        nrOfYoungPeople: number;
        story: string;
        yearsOfExistence: number;
        certifications: number;
        regionInformationL: string;
    };
    batchDetails: {
        code: string;
        cocoaType: string;
        totalNetWeight: number;
        processingDate: Date;
        humidityPercentage: number;
        grainIndex: number;
        fermentationDays: number;
        fermentationModeL: string;
        conversionFactor: string;
        sensoryProfile: string;
    };
    traceDetails: {
        producers: {
            haCocoa: number;
            haConservationForest: number;
            identifiedVarieties: string[];
            nrMen: number;
            nrWomen: number;
        };
        harvesting: {
            date: Date;
            pricePerKgCocoaPulp: number;
        };
        fermentation: {
            startDate: Date;
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
        drying: {
            startDate: Date;
            nrOfDays: number;
            finalHumidity: number;
        };
        storage: {
            startDate: Date;
            batchNetWeight: number;
            conversionFactor: string;
            fermentationPercentage: number;
            grainIndex: string;
        };
        sales: {
            buyer: string;
            negotiationTerm: string;
            pricePerKg: number;
            lot: string;
            country: string;
            negotiationDate: Date;
        };
    };
};
