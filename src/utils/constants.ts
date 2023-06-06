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
            FLIPS: {
                INVALID_INDEX: 'Index for Flip is invalid!',
                NOT_FOUND: 'Day Report does not exist!',
            },
            DAY_REPORT: {
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
        FLIPS: {
            SAVE_SUCCESS: 'Flip added successfully.',
        },
    },
};

export const DB_CONSTANTS = {
    ROLES: ['buyer', 'association', 'project'] as const,
};
