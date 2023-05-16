import { Request, Response, Router } from 'express';

import asyncMiddleware from '@/middleware/asyncMiddleware';

import { getAllAssociations } from '@/services/associationService';

import { APP_CONSTANTS } from '@/utils/constants';

const router = Router();

router.get(
    '/',
    asyncMiddleware(async (_req: Request, res: Response) => {
        const associations = await getAllAssociations();
        return res.status(200).json({
            success: true,
            message: APP_CONSTANTS.RESPONSE.ASSOCIATION.FETCH_SUCCESS,
            data: {
                associations,
            },
        });
    })
);

export default router;
