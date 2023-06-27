import { NextFunction, Request, Response, Router } from 'express';

import { recoverMessageAddress } from 'viem';

import asyncMiddleware from '@/middleware/asyncMiddleware';
import extractJWT from '@/middleware/extractJWT';
import requiresAuth from '@/middleware/guards/requiresAuth';
import requiresRoles from '@/middleware/guards/requiresRole';
import validate from '@/middleware/validate';

import { getBatchByCode } from '@/services/batchService';
import {
    createCertification,
    getCertificationByFingerprint,
    updateCertificationWithSignedData,
} from '@/services/certification.service';

import { fingerprintBatchData } from '@/utils/certifications';
import { APP_CONSTANTS } from '@/utils/constants';
import ApiError from '@/utils/types/errors/ApiError';
import { JWTToken } from '@/utils/types/server';
import {
    createBatchBaseCertificateSchema,
    saveBatchSignedCertificationSchema,
} from '@/utils/validations/nftValidation';

import certNFTs from '../../scripts/data/certificationNFT.json';

const router = Router();

// Get Batch Details from wala via Signature key from NFT Metadata.
router.get(
    '/:key',
    asyncMiddleware(async (_req: Request, res: Response) => {
        return res.status(200).json({
            success: true,
            message: APP_CONSTANTS.RESPONSE.CERTIFICATION.FIND_SUCCESS,
            data: {
                certificationNFT: certNFTs[0],
            },
        });
    })
);

// Create new Base Certification for Batch.
router.post(
    '/:code',
    extractJWT,
    requiresAuth,
    requiresRoles(['project', 'association']),
    validate(createBatchBaseCertificateSchema),
    asyncMiddleware(async (req: Request, res: Response, next: NextFunction) => {
        const { code } = req.params;

        const token: JWTToken = res.locals.jwt;

        if (!code) {
            return next(
                new ApiError(400, APP_CONSTANTS.RESPONSE.BATCH.MISSING_CODE)
            );
        }

        const batch = await getBatchByCode(code);

        if (!batch) {
            return next(
                new ApiError(404, APP_CONSTANTS.RESPONSE.BATCH.NOT_FOUND)
            );
        }

        if (!batch.sale) {
            return next(
                new ApiError(
                    400,
                    APP_CONSTANTS.RESPONSE.CERTIFICATION.BATCH_NOT_SOLD
                )
            );
        }

        // Generate fingerprint of snapshot
        const batchHashed = fingerprintBatchData(batch, 'sha256');
        // Save fingerprint with snapshot & algorithm chosen

        const dateFingerprint = new Date();

        const existingFingerprintCertification =
            await getCertificationByFingerprint(batchHashed.fingerprint);

        if (existingFingerprintCertification) {
            return next(
                new ApiError(
                    400,
                    APP_CONSTANTS.RESPONSE.CERTIFICATION.FINGERPRINT_EXISTS
                )
            );
        }

        const certification = await createCertification({
            codeBatch: code,
            dateFingerprint: dateFingerprint,
            algoFingerprint: batchHashed.algorithm,
            dataFingerprint: batchHashed.fingerprint,
            signerWallet: token.address,
        });

        return res.status(200).json({
            success: true,
            message: APP_CONSTANTS.RESPONSE.CERTIFICATION.GENERATE_SUCCESS,
            data: {
                certification,
                batchHashed,
            },
        });
    })
);

// Update Base Certification with signed Details.
router.patch(
    '/:code',
    extractJWT,
    requiresAuth,
    requiresRoles(['project', 'association']),
    validate(saveBatchSignedCertificationSchema),
    asyncMiddleware(async (req: Request, res: Response, next: NextFunction) => {
        // Get Code of the batch
        const { code } = req.params;

        // Get Certification Fingerprints and Signature Details
        const { datafingerPrint, signedDataFingerprint, dateSigned } =
            req.body.fingerprints;

        // Get Token
        const token: JWTToken = res.locals.jwt;

        // CHECK BATCH DETAILS START
        if (!code) {
            return next(
                new ApiError(400, APP_CONSTANTS.RESPONSE.BATCH.MISSING_CODE)
            );
        }

        const batch = await getBatchByCode(code);

        if (!batch) {
            return next(
                new ApiError(404, APP_CONSTANTS.RESPONSE.BATCH.NOT_FOUND)
            );
        }

        if (!batch.sale) {
            return next(
                new ApiError(
                    400,
                    APP_CONSTANTS.RESPONSE.CERTIFICATION.BATCH_NOT_SOLD
                )
            );
        }
        // CHECK BATCH DETAILS END

        const certification = await getCertificationByFingerprint(
            datafingerPrint
        );

        if (!certification) {
            return next(
                new ApiError(
                    400,
                    APP_CONSTANTS.RESPONSE.CERTIFICATION.NOT_FOUND
                )
            );
        }

        // CHECK AUTHENTICATED WALLET TO HAVE SIGNED FINGERPRINT START
        const recoveredAddress = await recoverMessageAddress({
            message: datafingerPrint,
            signature: signedDataFingerprint,
        });

        if (recoveredAddress.toString().toLowerCase() !== token.address) {
            return next(
                new ApiError(401, `You did not sign for this certification!`)
            );
        }
        // CHECK AUTHENTICATED WALLET TO HAVE SIGNED FINGERPRINT END

        // TODO:
        // Save fingerprint with data snapshot & algorithm chosen to wala
        // Get certificatino hash key and save along with signature data.

        const updatedCertification = updateCertificationWithSignedData(
            datafingerPrint,
            { signedDataFingerprint, dateSigned, signerWallet: token.address }
        );

        return res.status(200).json({
            success: true,
            message: APP_CONSTANTS.RESPONSE.CERTIFICATION.GENERATE_SUCCESS,
            data: {
                updatedCertification,
            },
        });
    })
);

export default router;
