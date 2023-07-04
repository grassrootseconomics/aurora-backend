import { Router } from 'express';

import associationController from '@/controllers/association.controller';
import authController from '@/controllers/auth.controller';
import batchController from '@/controllers/batch.controller';
import departmentController from '@/controllers/department.controller';
import nftController from '@/controllers/nft.controller';
import producerController from '@/controllers/producer.controller';
import pulpController from '@/controllers/pulp.controller';

const router = Router();

router.use('/auth', authController);
router.use('/pulp', pulpController);
router.use('/batch', batchController);
router.use('/producer', producerController);
router.use('/association', associationController);
router.use('/department', departmentController);
router.use('/nft', nftController);

export default router;
