import { ISearchParameters } from '../server';

/**
 * Search Parameters for Batches.
 */
export default interface ISearchBatchParams extends ISearchParameters {
    department: string;
}
