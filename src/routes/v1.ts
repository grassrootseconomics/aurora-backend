import { NextFunction, Request, Response, Router } from 'express';

import axios, { AxiosResponse } from 'axios';
import JSZip from 'jszip';

import associationController from '@/controllers/association.controller';
import authController from '@/controllers/auth.controller';
import batchController from '@/controllers/batch.controller';
import departmentController from '@/controllers/department.controller';
import producerController from '@/controllers/producer.controller';
import pulpController from '@/controllers/pulp.controller';

import asyncMiddleware from '@/middleware/asyncMiddleware';

import ApiError from '@/utils/types/errors/ApiError';

const router = Router();

router.get(
    '/',
    asyncMiddleware(
        async (_req: Request, res: Response, next: NextFunction) => {
            const response: AxiosResponse<ArrayBuffer> =
                await axios.get<ArrayBuffer>(
                    'http://localhost:8383/v1/projects/1/forms/C-Fermentación-Volteo/submissions.csv.zip?attachments=false&groupPaths=true&deletedFields=false&splitSelectMultiples=true&filter=',
                    {
                        responseType: 'arraybuffer',
                    }
                );
            try {
                const zipData: ArrayBuffer = response.data;

                const zip: JSZip = await JSZip.loadAsync(zipData);

                const csvFiles: string[] = [];
                await Promise.all(
                    zip.file(/\.csv$/i).map(async (file) => {
                        const content: string = await file.async('string');
                        console.log(content);
                        csvFiles.push(content);
                    })
                );

                return res.status(200).json({
                    success: true,
                    message: 'Yep',
                    data: {
                        csvFiles,
                    },
                });
            } catch (error) {
                next(new ApiError(500, error.message));
            }
        }
    )
);

router.use('/auth', authController);
router.use('/pulp', pulpController);
router.use('/batch', batchController);
router.use('/producer', producerController);
router.use('/association', associationController);
router.use('/department', departmentController);

export default router;
