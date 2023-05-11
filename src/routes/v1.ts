import { Router, Request, Response } from 'express';
import asyncMiddleware from '../middleware/asyncMiddleware';
import { APP_CONSTANTS } from '../utils/constants';
import { getAllUsers } from '../services/users';

const router = Router();

router.get(
    '/',
    asyncMiddleware(async (_req: Request, res: Response) => {
        const users = await getAllUsers();
        return res.status(200).json({
            success: true,
            message: APP_CONSTANTS.RESPONSE.ROOT.SUCCESS,
            data: {
                users,
            },
        });
    })
);

export default router;
