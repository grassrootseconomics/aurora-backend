export const APP_CONSTANTS = {
    RESPONSE: {
        ROOT: {
            SUCCESS: "You've reached the v1 API!",
            MISSING_DATA: 'Required Parameters are missing.',
        },
        BATCH: {
            MISSING_CODE: 'Missing Code.',
            UPDATE_SUCCESS: 'Values Updated Successfully!',
            FETCH_SUCCESS: 'Successfully fetched the batches!',
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
