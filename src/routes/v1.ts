import { Request, Response, Router } from 'express';

import axios from 'axios';
import JSZip from 'jszip';

import associationController from '@/controllers/association.controller';
import authController from '@/controllers/auth.controller';
import batchController from '@/controllers/batch.controller';
import departmentController from '@/controllers/department.controller';
import producerController from '@/controllers/producer.controller';

import asyncMiddleware from '@/middleware/asyncMiddleware';

import { APP_CONSTANTS } from '@/utils/constants';

const router = Router();

router.get(
    '/',
    asyncMiddleware(async (_req: Request, res: Response) => {
        const response = await axios.get(
            'http://localhost:8383/v1/projects/1/forms/Aurora-A-Productor/submissions.csv.zip?attachments=false&groupPaths=true&deletedFields=false&splitSelectMultiples=false'
        );

        const zip = new JSZip();

        zip.loadAsync(response.data)
            .then((data) => {
                console.log(data);

                return res.status(200).json({
                    success: true,
                    message: APP_CONSTANTS.RESPONSE.ROOT.SUCCESS,
                });
            })
            .catch((err) => {
                console.error('Loading error');
                throw err;
            });
    })
);

router.use('/auth', authController);
router.use('/batch', batchController);
router.use('/producer', producerController);
router.use('/association', associationController);
router.use('/department', departmentController);

export default router;
