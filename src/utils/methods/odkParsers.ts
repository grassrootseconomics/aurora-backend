import {
    AuroraAProductorForm,
    AuroraBColeccionForm,
    AuroraCFermentacionForm,
    AuroraCFermentacionFormPH,
    AuroraCFermentacionFormVolteo,
    AuroraDSecadoForm,
    AuroraEAlmacenamientoForm,
    AuroraFVentasForm,
} from '../types/odk/forms';
import { csvToJSONArray } from './csv';

export const parseProductionFormSubmissions = (
    csvFile: string
): AuroraAProductorForm[] => {
    return csvToJSONArray(csvFile) as AuroraAProductorForm[];
};

export const parseCollectionFormSubmissions = (
    csvFile: string
): AuroraBColeccionForm[] => {
    return csvToJSONArray(csvFile) as AuroraBColeccionForm[];
};

export const parseFermentationFormSubmissions = (
    csvFile: string
): AuroraCFermentacionForm[] => {
    return csvToJSONArray(csvFile) as AuroraCFermentacionForm[];
};

export const parseFermentationPHFormSubmissions = (
    csvFile: string
): AuroraCFermentacionFormPH[] => {
    return csvToJSONArray(csvFile) as AuroraCFermentacionFormPH[];
};

export const parseFermentationVolteoFormSubmissions = (
    csvFile: string
): AuroraCFermentacionFormVolteo[] => {
    return csvToJSONArray(csvFile) as AuroraCFermentacionFormVolteo[];
};

export const parseDryingFormSubmissions = (
    csvFile: string
): AuroraDSecadoForm[] => {
    return csvToJSONArray(csvFile) as AuroraDSecadoForm[];
};

export const parseStorageFormSubmissions = (
    csvFile: string
): AuroraEAlmacenamientoForm[] => {
    return csvToJSONArray(csvFile) as AuroraEAlmacenamientoForm[];
};

export const parseSalesFormSubmissions = (
    csvFile: string
): AuroraFVentasForm[] => {
    return csvToJSONArray(csvFile) as AuroraFVentasForm[];
};
