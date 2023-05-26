import {
    DryingPhase as Drying,
    FermentationPhase as Fermentation,
    Pulp,
    Sale,
    Storage,
} from '@prisma/client';

import { ISearchParameters } from '../server';

type ExcludableBatchPhaseProps = 'id' | 'codeBatch';

type SearchBatchesFilterField = 'association' | 'department';

export type StoragePhaseUpdate = Omit<Storage, ExcludableBatchPhaseProps>;

export type DryingPhaseUpdate = Omit<Drying, ExcludableBatchPhaseProps>;

export type SalesPhaseUpdate = Omit<Sale, ExcludableBatchPhaseProps>;

export type PulpUpdate = Omit<Pulp, ExcludableBatchPhaseProps | 'codeProducer'>;

export type FermentationPhaseUpdate = Omit<
    Fermentation,
    ExcludableBatchPhaseProps
>;
/**
 * Search Parameters for Batches.
 */
export interface ISearchBatchParams extends ISearchParameters {
    filterField: SearchBatchesFilterField;
    filterValue: string;
    sold?: boolean;
    internationallySold?: boolean;
    year?: number;
}
