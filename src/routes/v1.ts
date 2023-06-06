import { Request, Response, Router } from 'express';

import associationController from '@/controllers/association.controller';
import authController from '@/controllers/auth.controller';
import batchController from '@/controllers/batch.controller';
import departmentController from '@/controllers/department.controller';
import producerController from '@/controllers/producer.controller';
import pulpController from '@/controllers/pulp.controller';

import asyncMiddleware from '@/middleware/asyncMiddleware';

import { APP_CONSTANTS } from '@/utils/constants';

const router = Router();

router.get(
    '/',
    asyncMiddleware(async (_req: Request, res: Response) => {
        return res.status(200).json({
            success: true,
            message: APP_CONSTANTS.RESPONSE.ROOT.SUCCESS,
        });
    })
);

router.use('/auth', authController);
router.use('/pulp', pulpController);
router.use('/batch', batchController);
router.use('/producer', producerController);
router.use('/association', associationController);
router.use('/department', departmentController);

export default router;
