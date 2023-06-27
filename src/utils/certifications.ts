import { Batch } from '@prisma/client';
import crypto from 'crypto';

type AllowedAlgorythms = 'sha256';

type FingerprintHashResult = {
    fingerprint: string;
    algorithm: string;
};

/**
 *
 * Fingerprints a received string data.
 *
 * @param {Batch} data Batch Info to hash.
 * @param {AllowedAlgorythms} algo Algorithm chosen.
 * @returns
 */
export const fingerprintBatchData = (
    data: Batch,
    algo: AllowedAlgorythms
): FingerprintHashResult => {
    const stringifiedBatch = JSON.stringify(data);

    const hash = crypto.createHash(algo);

    hash.update(stringifiedBatch, 'utf8');

    const fingerprint = hash.digest('hex');

    return {
        fingerprint,
        algorithm: algo,
    };
};
