import { Producer } from '@prisma/client';

import { ISearchParameters } from '../server';

type ExcludableBatchPhaseProps = 'id' | 'code';

type SearchProducersFilterField = 'association' | 'department';

export type ProducerUpdate = Omit<Producer, ExcludableBatchPhaseProps>;

export interface ISearchProducerParams extends ISearchParameters {
    filterField: SearchProducersFilterField;
    filterValue: string;
}
