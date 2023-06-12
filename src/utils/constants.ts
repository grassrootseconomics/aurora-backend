export const APP_CONSTANTS = {
    RESPONSE: {
        ROOT: {
            SUCCESS: "You've reached the v1 API!",
            MISSING_DATA: 'Required Parameters are missing.',
        },
        BATCH: {
            MISSING_CODE: 'Missing Code.',
            NOT_FOUND: 'Batch with given code does not exist!',
            UPDATE_SUCCESS: 'Values Updated Successfully!',
            FETCH_SUCCESS: 'Successfully fetched the batches!',
        },
        PULP: {
            INVALID_ID: 'Pulp Id is invalid!',
            SAVE: {
                SUCCESS: 'Successfully saved pulp!',
            },
            UPDATE: {
                SUCCESS: 'Successfully updated pulp!',
                MISSING_VALUES: 'Missing Update Details!',
            },
            DELETE: {
                SUCCESS: 'Successfully removed pulp!',
            },
        },
        FERMENTATION: {
            INVALID_ID: 'Fermentation Phase Id is invalid!',
            UPDATE_SUCCESS: 'Successfully updated fermentation detail!',
            FLIP: {
                SAVE_SUCCESS: 'Flip added successfully.',
                INVALID_INDEX: 'Index for Flip is invalid!',
                NOT_FOUND: 'Day Report does not exist!',
            },
            DAY_REPORT: {
                SAVE_SUCCESS: 'Daily Report added successfully.',
                INVALID_INDEX: 'Index for Day is invalid!',
                NOT_FOUND: 'Day Report does not exist!',
            },
        },
        STORAGE: {
            INVALID_ID: 'Storage Phase Id is invalid!',
        },
        DRYING: {
            INVALID_ID: 'Drying Phase Id is invalid!',
        },
        SALES: {
            INVALID_ID: 'Sales Phase Id is invalid!',
        },
        PRODUCER: {
            MISSING_CODE: 'Missing Code.',
            NOT_FOUND: 'Producer with given code does not exist!',
            UPDATE_SUCCESS: 'Producer Updated Successfully!',
            LINK_BATCH_EXISTS: 'Producer is already linked to this Batch!',
            FAILED_BATCH_CHANGE: 'Could not update Batches!',
            FETCH_SUCCESS: 'Successfully Fetched Producer Data!',
            SEARCH_SUCCESS: 'Successfully searched producers!',
        },
        ASSOCIATION: {
            FETCH_SUCCESS: 'Successfully Fetched Association Data!',
            NOT_FOUND: 'Association Does Not Exist!',
        },
        DEPARTMENT: {
            FETCH_SUCCESS: 'Successfully Fetched Department Data!',
            NOT_FOUND: 'Department Does Not Exist!',
        },
    },
};

export const DB_CONSTANTS = {
    ROLES: ['buyer', 'association', 'project'] as const,
};

export const SYNC_ODK_FORM_IDS = [
    'A-Productor',
    'A-Productor-Finca',
    'A-Productor-GPS',
    'B-Recolección',
    'C-Fermentación',
    'C-Fermentación-PH',
    'C-Fermentación-Volteo',
    'D-Secado',
    'E-Almacenamiento',
    'F-Ventas',
] as const;

export const AuroraAProductorFormEntries = [
    'SubmissionDate',
    'note1',
    'dateofsurvey',
    'starttime',
    'endtime',
    'enumerator',
    'farmer_first_name',
    'farmer_last_name',
    'phone_number',
    'note1a',
    'hhconsent',
    'grp_a_noconsent-noconsentwhy',
    'grp_a_noconsent-noconsentwhyoth',
    'a-mobile',
    'a-resp_gender',
    'a-age',
    'a-department',
    'a-town',
    'a-village_name',
    'a-association',
    'a-management',
    'a-farms',
    'a-farm_name',
    'a-total_area',
    'a-cacao_area',
    'a-gpsloc-Latitude',
    'a-gpsloc-Longitude',
    'a-gpsloc-Altitude',
    'a-gpsloc-Accuracy',
    'a-lots',
    'a-lots_r_count',
    'a-protected',
    'a-protected_area',
    'a-water_sources',
    'a-water_sources_num',
    'a-animal',
    'a-producer_code',
    'a-old_producer_code',
    'a-producer_code_num',
    'a-code_note',
    'a-thank_you_note',
    'a-duration',
    'a-end_of_survey',
    'gen_comment',
    'meta-instanceID',
    'meta-instanceName',
    'KEY',
    'SubmitterID',
    'SubmitterName',
    'AttachmentsPresent',
    'AttachmentsExpected',
    'Status',
    'ReviewState',
    'DeviceID',
    'Edits',
    'FormVersion',
] as const;

export const AuroraBColeccionFormEntries = [
    'SubmissionDate',
    'note1',
    'dateofsurvey',
    'starttime',
    'endtime',
    'enumerator',
    'prod_code',
    'collection_date',
    'batch_weight_unknown',
    'can_weight_unknown',
    'batch_net_weight_unknown',
    'unknown_note',
    'batch_weight_aromatic',
    'can_weight_aromatic',
    'batch_net_weight_aromatic',
    'aromatic_note',
    'batch_weight_hybrid',
    'can_weight_hybrid',
    'batch_net_weight_hybrid',
    'hybrid_note',
    'batch_weight_CCN',
    'can_weight_CCN',
    'batch_net_weight_CCN',
    'CCN_note',
    'batch_quality',
    'batch_status',
    'batch_kg_price',
    'batch_total_price',
    'batch_total_note',
    'sales_receipt',
    'thank_you_note',
    'gen_comment',
    'meta-instanceID',
    'meta-instanceName',
    'KEY',
    'SubmitterID',
    'SubmitterName',
    'AttachmentsPresent',
    'AttachmentsExpected',
    'Status',
    'ReviewState',
    'DeviceID',
    'Edits',
    'FormVersion',
] as const;

export const AuroraCFermentacionFormEntries = [
    'SubmissionDate',
    'seca_note1',
    'dateofsurvey',
    'starttime',
    'endtime',
    'a1_enumerator',
    'batch_code',
    'num_codes',
    'code_r_count',
    'ferm_start_date',
    'batch_weight',
    'genetics',
    'cacao_type',
    'drained',
    'hours_drained',
    'brix_degrees',
    'inital_temp',
    'ph_mass',
    'ph_cotiledom',
    'flip_ambient',
    'flip_humidity',
    'flips',
    'thank_you_note',
    'gen_comment',
    'meta-instanceID',
    'meta-instanceName',
    'KEY',
    'SubmitterID',
    'SubmitterName',
    'AttachmentsPresent',
    'AttachmentsExpected',
    'Status',
    'ReviewState',
    'DeviceID',
    'Edits',
    'FormVersion',
] as const;

export const AuroraDSecadoFormEntries = [
    'SubmissionDate',
    'seca_note1',
    'dateofsurvey',
    'starttime',
    'endtime',
    'enumerator',
    'batch_code',
    'dry_start_date',
    'dry_type',
    'dry_end_date',
    'dry_days',
    'date_note',
    'moisture_final',
    'thank_you_note',
    'gen_comment',
    'meta-instanceID',
    'meta-instanceName',
    'KEY',
    'SubmitterID',
    'SubmitterName',
    'AttachmentsPresent',
    'AttachmentsExpected',
    'Status',
    'ReviewState',
    'DeviceID',
    'Edits',
    'FormVersion',
] as const;

export const AuroraEAlmacenamientoFormEntries = [
    'SubmissionDate',
    'seca_note1',
    'dateofsurvey',
    'starttime',
    'endtime',
    'enumerator',
    'batch_code',
    'storage_date',
    'weight',
    'conversion',
    'ferm_percent',
    'grain_index',
    'sensorial',
    'sensorial_score',
    'thank_you_note',
    'gen_comment',
    'meta-instanceID',
    'meta-instanceName',
    'KEY',
    'SubmitterID',
    'SubmitterName',
    'AttachmentsPresent',
    'AttachmentsExpected',
    'Status',
    'ReviewState',
    'DeviceID',
    'Edits',
    'FormVersion',
] as const;

export const AuroraFVentasFormEntries = [
    'SubmissionDate',
    'note1',
    'dateofsurvey',
    'starttime',
    'endtime',
    'enumerator',
    'prod_code',
    'buyer',
    'tot_weight',
    'batch_lot',
    'lot_code',
    'nego_type',
    'nego_term',
    'dest_country',
    'currency',
    'val_kg',
    'batch_total_price',
    'total_note',
    'nego_date',
    'thank_you_note',
    'gen_comment',
    'meta-instanceID',
    'meta-instanceName',
    'KEY',
    'SubmitterID',
    'SubmitterName',
    'AttachmentsPresent',
    'AttachmentsExpected',
    'Status',
    'ReviewState',
    'DeviceID',
    'Edits',
    'FormVersion',
] as const;
