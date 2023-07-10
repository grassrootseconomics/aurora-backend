import { NextFunction, Request, Response, Router } from 'express';

import { recoverMessageAddress } from 'viem';
import { xml2js } from 'xml-js';

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
    checkOwnerOfCertification,
    getCertificateBySignedFingerprint,
    saveNFTCertificateOwnership,
} from '@/services/certificateOwnerService';
import {
    createCertification,
    getCertificationByKey,
    getLatestSignedCertificationForBatch,
} from '@/services/certification.service';
import { getDataByHash, sendXMLDataToWala } from '@/services/walaService';

import { APP_CONSTANTS } from '@/utils/constants';
import { convertObjectToXml, convertXmlToObject } from '@/utils/methods/xml';
import {
    CertificationNFT,
    CertificationSignedLink,
    FromXmlCertificationSignedLink,
} from '@/utils/types/certification';
import ApiError from '@/utils/types/errors/ApiError';
import { JWTToken } from '@/utils/types/server';
import {
    createBatchBaseCertificateSchema,
    getBatchCertificateNFTDetailsSchema,
    saveBatchNFTCertificationSchema,
    saveBatchSignedCertificationSchema,
} from '@/utils/validations/nftValidation';

const router = Router();

// Get Batch Details from wala via Signature key from NFT Metadata.
router.get(
    '/metadata/:code',
    extractJWT,
    requiresAuth,
    requiresRoles(['project', 'association', 'buyer']),
    validate(getBatchCertificateNFTDetailsSchema),
    asyncMiddleware(async (req: Request, res: Response, next: NextFunction) => {
        const { code } = req.params;

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

        const token: JWTToken = res.locals.jwt;

        const certification = await getLatestSignedCertificationForBatch(code);

        if (!certification) {
            return next(
                new ApiError(
                    400,
                    APP_CONSTANTS.RESPONSE.CERTIFICATION.NOT_FOUND
                )
            );
        }
        // For buyers, we check the ownership
        if (token.role === 'buyer') {
            // Check if the authenticated user truly owns the certification
            const isOwnerInDB = checkOwnerOfCertification(
                token.address,
                certification.key
            );

            if (!isOwnerInDB) {
                return next(
                    new ApiError(
                        400,
                        APP_CONSTANTS.RESPONSE.CERTIFICATION.NOT_OWNED
                    )
                );
            }

            // Should also check the NFT on the blockchain.
        }

        const signedLinkXml: string = await getDataByHash(certification.key);

        const { root: signedLink }: { root: CertificationSignedLink } =
            convertXmlToObject(`<root>${signedLinkXml}</root>`) as any;

        const xmlBatchMetadata = await getDataByHash(
            signedLink.fingerprintHash
        );

        const jsonBatchMetadata: { batchSnapshotData: CertificationNFT } =
            convertXmlToObject(xmlBatchMetadata);

        return res.status(200).json({
            success: true,
            message: APP_CONSTANTS.RESPONSE.CERTIFICATION.FIND_SUCCESS,
            data: {
                batchMetadata: jsonBatchMetadata.batchSnapshotData,
            },
        });
    })
);

// Step #1
// Create new Base Certification for Batch.
router.post(
    '/snapshot/:code',
    extractJWT,
    requiresAuth,
    requiresRoles(['project', 'association']),
    validate(createBatchBaseCertificateSchema),
    asyncMiddleware(async (req: Request, res: Response, next: NextFunction) => {
        const { code } = req.params;

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

        // // Hash of Data does not exist
        // // This means that the batch info changed.
        // // Generate a new certification.
        const certificationHash = await sendXMLDataToWala(xmlVersion);

        return res.status(200).json({
            success: true,
            message: APP_CONSTANTS.RESPONSE.CERTIFICATION.SIGN_SUCCESS,
            data: {
                fingerprint: certificationHash,
            },
        });
    })
);

// Step #2
// Update Base Certification with signed Details.
router.post(
    '/signing/:code',
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

        const data = await getDataByHash(dataFingerprint);

        if (!data) {
            return next(
                new ApiError(404, 'Snapshot Fingerprint Does not Exist!')
            );
        }

        const existingCertification = await getCertificateBySignedFingerprint(
            signedDataFingerprint
        );

        // Check if the signed data fingerprint exists.
        if (existingCertification) {
            return res.status(200).json({
                success: true,
                message: APP_CONSTANTS.RESPONSE.CERTIFICATION.GENERATE_SUCCESS,
                data: {
                    key: existingCertification.key,
                },
            });
        } else {
            // Proceed with creating a new certification.

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
                    new ApiError(
                        401,
                        `You did not sign for this certification!`
                    )
                );
            }
            // END CHECK AUTHENTICATED WALLET TO HAVE SIGNED FINGERPRINT

            // Create link between signature and fingerprintHash of Data Snapshot.
            const xmlSignatureLink = convertObjectToXml({
                fingerprintHash: dataFingerprint,
                hasSignature: signedDataFingerprint,
            });

            const key = await sendXMLDataToWala(xmlSignatureLink);

            const createdCert = await createCertification({
                codeBatch: code,
                dateSigned,
                signedDataFingerprint,
                signerWallet: recoveredAddress,
                key,
            });

            return res.status(200).json({
                success: true,
                message: APP_CONSTANTS.RESPONSE.CERTIFICATION.GENERATE_SUCCESS,
                data: {
                    key: createdCert.key,
                },
            });
        }
    })
);

// Step #3
// Update Base Certification with minted NFT ID and receiver Details.
router.post(
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
            const ownership = await saveNFTCertificateOwnership({
                minterWallet,
                buyerWallet,
                tokenId,
                certificationKey: certificateKey,
            });

            return res.status(200).json({
                success: true,
                message: APP_CONSTANTS.RESPONSE.CERTIFICATION.MINT_SUCCESS,
                data: {
                    ownership,
                },
            });
        }
    })
);

export default router;
