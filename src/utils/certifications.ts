import { Batch } from '@prisma/client';
import crypto from 'crypto';

import { CertificationNFT } from './types/certification';

type AllowedAlgorythms = 'sha256';

type FingerprintHashResult = {
    fingerprint: string;
    algorithm: string;
};

/**
 *
 * Fingerprints a received string data.
 *
 * @param {Batch | string} data Batch Info to hash.
 * @param {AllowedAlgorythms} algo Algorithm chosen.
 * @returns
 */
export const fingerprintBatchData = (
    data: CertificationNFT | string,
    algo: AllowedAlgorythms
): FingerprintHashResult => {
    let stringifiedContent: string;
    if (typeof data === 'string') stringifiedContent = data;
    else stringifiedContent = JSON.stringify(data);

    const hash = crypto.createHash(algo);

    hash.update(stringifiedContent, 'utf8');

    const fingerprint = hash.digest('hex');

    return {
        fingerprint,
        algorithm: algo,
    };
};
