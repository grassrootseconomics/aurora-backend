import { Request, Response, Router } from 'express';

import batchController from '@/controllers/batch.controller';
import producerController from '@/controllers/producer.controller';

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

router.use('/batch', batchController);
router.use('/producer', producerController);

export default router;
