import { Pulp } from '@prisma/client';

type ExcludableBatchPhaseProps = 'id' | 'batchesUsedFor';

export type AddPulp = Omit<Pulp, ExcludableBatchPhaseProps> & {
    codeBatch: string;
};

export type UpdatePulp = Partial<AddPulp>;
