import { Request, Response, Router } from 'express';

import asyncMiddleware from '@/middleware/asyncMiddleware';

import { getAllDepartments } from '@/services/departmentService';

import { APP_CONSTANTS } from '@/utils/constants';

const router = Router();

router.get(
    '/',
    asyncMiddleware(async (_req: Request, res: Response) => {
        const departments = await getAllDepartments();
        return res.status(200).json({
            success: true,
            message: APP_CONSTANTS.RESPONSE.DEPARTMENT.FETCH_SUCCESS,
            data: {
                departments,
            },
        });
    })
);

export default router;
