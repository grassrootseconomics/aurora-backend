import { Producer } from '@prisma/client';

type ExcludableBatchPhaseProps = 'id' | 'code';

export type ProducerUpdate = Omit<Producer, ExcludableBatchPhaseProps>;
