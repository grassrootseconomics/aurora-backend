import { NextFunction, Request, Response, Router } from 'express';

import { recoverMessageAddress } from 'viem';

import asyncMiddleware from '@/middleware/asyncMiddleware';
import extractJWT from '@/middleware/extractJWT';
import requiresAuth from '@/middleware/guards/requiresAuth';
import requiresRoles from '@/middleware/guards/requiresRole';
import validate from '@/middleware/validate';

import {
    getBatchByCode,
    getBatchCertificateSnapshotByCode,
} from '@/services/batchService';
import {
    createCertification,
    getCertificationByFingerprint,
    getCertificationByKey,
    updateCertificationFingerprintByCode,
    updateCertificationWithMintedData,
    updateCertificationWithSignedData,
} from '@/services/certification.service';
import { getDataByHash, sendXMLDataToWala } from '@/services/walaService';

import { fingerprintBatchData } from '@/utils/certifications';
import { APP_CONSTANTS } from '@/utils/constants';
import { convertObjectToXml, convertXmlToObject } from '@/utils/methods/xml';
import { CertificationSignedLink } from '@/utils/types/certification';
import ApiError from '@/utils/types/errors/ApiError';
import { JWTToken } from '@/utils/types/server';
import {
    createBatchBaseCertificateSchema,
    getBatchCertificateNFTDetailsSchema,
    saveBatchNFTCertificationSchema,
    saveBatchSignedCertificationSchema,
} from '@/utils/validations/nftValidation';

import certNFTs from '../../scripts/data/certificationNFT.json';

const router = Router();

// Get Batch Details from wala via Signature key from NFT Metadata.
router.get(
    '/:key',
    validate(getBatchCertificateNFTDetailsSchema),
    asyncMiddleware(async (req: Request, res: Response) => {
        const { key } = req.params;

        return res.status(200).json({
            success: true,
            message: APP_CONSTANTS.RESPONSE.CERTIFICATION.FIND_SUCCESS,
            data: {
                certificationNFT: certNFTs[0],
            },
        });
    })
);

// Step #1
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
        // Get Snapshot
        const batchSnapshotData = await getBatchCertificateSnapshotByCode(code);
        // Convert to XML
        const xmlVersion = convertObjectToXml({ batchSnapshotData });
        // Hash it first
        const fingerprintHash = fingerprintBatchData(xmlVersion, 'sha256');
        // When doing this, should check if exists and send that instead for signing if it was not signed or minted.
        const existingFingerprintCertification =
            await getCertificationByFingerprint(fingerprintHash.fingerprint);

        // Check if the certification already exists.
        if (existingFingerprintCertification) {
            // Check if this fingerprint was already minted
            if (
                existingFingerprintCertification.minterWallet ||
                existingFingerprintCertification.buyerWallet ||
                existingFingerprintCertification.tokenId
            )
                return next(
                    new ApiError(
                        400,
                        APP_CONSTANTS.RESPONSE.CERTIFICATION.FINGERPRINT_EXISTS
                    )
                );

            // Check if the data exists on wala.
            const data = getDataByHash(
                existingFingerprintCertification.dataFingerprint
            );
            // If it does, send the existing certification.
            if (data) {
                return res.status(200).json({
                    success: true,
                    message:
                        APP_CONSTANTS.RESPONSE.CERTIFICATION
                            .RETURN_EXISTING_CERT,
                    data: {
                        fingerprint:
                            existingFingerprintCertification.dataFingerprint,
                    },
                });
            } else {
                // If not, recreate and update with a new certification from wala.
                const batchSnapshotData =
                    await getBatchCertificateSnapshotByCode(code);

                const xmlVersion = convertObjectToXml({ batchSnapshotData });
                const certificationHash = await sendXMLDataToWala(xmlVersion);

                await updateCertificationFingerprintByCode(
                    existingFingerprintCertification.dataFingerprint,
                    certificationHash
                );

                return res.status(200).json({
                    success: true,
                    message:
                        APP_CONSTANTS.RESPONSE.CERTIFICATION
                            .GENERATE_UPDATE_CERT,
                    data: {
                        fingerprint: certificationHash,
                    },
                });
            }
        } else {
            // Hash of Data does not exist
            // This means that the batch info changed.
            // Generate a new certification.
            const certificationHash = await sendXMLDataToWala(xmlVersion);
            const dateFingerprint = new Date();
            const certification = await createCertification({
                codeBatch: code,
                dateFingerprint: dateFingerprint,
                dataFingerprint: certificationHash,
                signerWallet: token.address,
            });

            return res.status(200).json({
                success: true,
                message: APP_CONSTANTS.RESPONSE.CERTIFICATION.SIGN_SUCCESS,
                data: {
                    fingerprint: certification.dataFingerprint,
                },
            });
        }
    })
);

// Step #2
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
        const { dataFingerprint, signedDataFingerprint, dateSigned } =
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
            dataFingerprint
        );

        if (!certification) {
            return next(
                new ApiError(
                    400,
                    APP_CONSTANTS.RESPONSE.CERTIFICATION.NOT_FOUND
                )
            );
        }

        // Check If it was already signed
        if (certification.key) {
            const data = await getDataByHash(certification.key);

            const signedLink: CertificationSignedLink = convertXmlToObject(
                data
            ) as CertificationSignedLink;

            // Check if the data is valid
            if (
                signedLink &&
                signedLink.fingerprintHash === certification.dataFingerprint &&
                signedLink.hasSignature === certification.signedDataFingerprint
            ) {
                return res.status(200).json({
                    success: true,
                    message:
                        APP_CONSTANTS.RESPONSE.CERTIFICATION.GENERATE_SUCCESS,
                    data: {
                        key: certification.key,
                    },
                });
            }
        }

        // START CHECK AUTHENTICATED WALLET TO HAVE SIGNED FINGERPRINT
        const recoveredAddress = await recoverMessageAddress({
            message: dataFingerprint,
            signature: signedDataFingerprint,
        });

        if (
            recoveredAddress.toString().toLowerCase() !==
            token.address.toLowerCase()
        ) {
            return next(
                new ApiError(401, `You did not sign for this certification!`)
            );
        }
        // END CHECK AUTHENTICATED WALLET TO HAVE SIGNED FINGERPRINT

        // Create link between signature and fingerprintHash of Data Snapshot.
        const xmlSignatureLink = convertObjectToXml({
            fingerprintHash: dataFingerprint,
            hasSignature: signedDataFingerprint,
        });

        const key = await sendXMLDataToWala(xmlSignatureLink);

        const updatedCert = await updateCertificationWithSignedData(
            dataFingerprint,
            {
                signedDataFingerprint,
                dateSigned,
                signerWallet: token.address,
                key,
            }
        );

        return res.status(200).json({
            success: true,
            message: APP_CONSTANTS.RESPONSE.CERTIFICATION.GENERATE_SUCCESS,
            data: {
                key: updatedCert.key,
            },
        });
    })
);

// Step #3
// Update Base Certification with minted NFT ID and receiver Details.
router.patch(
    '/mint/:code',
    extractJWT,
    requiresAuth,
    requiresRoles(['project', 'association']),
    validate(saveBatchNFTCertificationSchema),
    asyncMiddleware(async (req: Request, res: Response, next: NextFunction) => {
        const { code } = req.params;

        const { minterWallet, buyerWallet, tokenId, certificateKey } =
            req.body.mintDetails;
        // Check if wallets are valid

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

        // Check if certification exists
        const certification = await getCertificationByKey(certificateKey);

        if (!certification) {
            return next(
                new ApiError(
                    400,
                    APP_CONSTANTS.RESPONSE.CERTIFICATION.NOT_FOUND
                )
            );
        } else {
            await updateCertificationWithMintedData(certificateKey, {
                minterWallet,
                buyerWallet,
                tokenId,
            });

            return res.status(200).json({
                success: true,
                message: APP_CONSTANTS.RESPONSE.CERTIFICATION.MINT_SUCCESS,
            });
        }
    })
);

export default router;
