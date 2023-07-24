import {
    AuroraAProductorFormEntries,
    AuroraAProductorGPSEntries,
    AuroraBColeccionFormEntries,
    AuroraCFermentacionFormEntries,
    AuroraCFermentacionFormProdCodeEntries,
    AuroraCFermentacionFormProdPulpCodeEntries,
    AuroraCFermentacionPHFormEntries,
    AuroraCFermentacionVolteoFormEntries,
    AuroraDSecadoFormEntries,
    AuroraEAlmacenamientoFormEntries,
    AuroraFVentasFormEntries,
    SYNC_ODK_FORM_IDS,
} from '@/utils/constants';

export type AuroraAProductorForm = Record<
    (typeof AuroraAProductorFormEntries)[number],
    string
>;

export type AuroraAProductorGPSForm = Record<
    (typeof AuroraAProductorGPSEntries)[number],
    string
>;

export type AuroraBColeccionForm = Record<
    (typeof AuroraBColeccionFormEntries)[number],
    string
>;

export type AuroraCFermentacionForm = Record<
    (typeof AuroraCFermentacionFormEntries)[number],
    string
>;
export type AuroraCFermentacionFormProdCodes = Record<
    (typeof AuroraCFermentacionFormProdCodeEntries)[number],
    string
>;
export type AuroraCFermentacionFormProdPulpCodes = Record<
    (typeof AuroraCFermentacionFormProdPulpCodeEntries)[number],
    string
>;

export type AuroraCFermentacionFormPH = Record<
    (typeof AuroraCFermentacionPHFormEntries)[number],
    string
>;
export type AuroraCFermentacionFormVolteo = Record<
    (typeof AuroraCFermentacionVolteoFormEntries)[number],
    string
>;

export type AuroraDSecadoForm = Record<
    (typeof AuroraDSecadoFormEntries)[number],
    string
>;

export type AuroraEAlmacenamientoForm = Record<
    (typeof AuroraEAlmacenamientoFormEntries)[number],
    string
>;

export type AuroraFVentasForm = Record<
    (typeof AuroraFVentasFormEntries)[number],
    string
>;

export type AuroraFormID = (typeof SYNC_ODK_FORM_IDS)[number];
