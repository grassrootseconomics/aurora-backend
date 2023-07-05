import { NextFunction, Request, Response, Router } from 'express';

import asyncMiddleware from '@/middleware/asyncMiddleware';
import extractJWT from '@/middleware/extractJWT';
import requiresAuth from '@/middleware/guards/requiresAuth';
import requiresRoles from '@/middleware/guards/requiresRole';
import validate from '@/middleware/validate';

import {
    getAllDepartments,
    getDepartmentById,
    updateDepartment,
} from '@/services/departmentService';

import { APP_CONSTANTS } from '@/utils/constants';
import ApiError from '@/utils/types/errors/ApiError';
import { updateDepartmentSchema } from '@/utils/validations/departmentValidations';

const router = Router();

router.get(
    '/',
    extractJWT,
    requiresAuth,
    requiresRoles(['project', 'association']),
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

router.get(
    '/:id',
    extractJWT,
    requiresAuth,
    requiresRoles(['project', 'association']),
    asyncMiddleware(async (req: Request, res: Response, next: NextFunction) => {
        const { id } = req.params;

        const department = await getDepartmentById(parseInt(id));

        if (!department) {
            return next(
                new ApiError(400, APP_CONSTANTS.RESPONSE.DEPARTMENT.NOT_FOUND)
            );
        }

        return res.status(200).json({
            success: true,
            message: APP_CONSTANTS.RESPONSE.DEPARTMENT.FETCH_SUCCESS,
            data: {
                department,
            },
        });
    })
);

router.patch(
    '/:id',
    extractJWT,
    requiresAuth,
    requiresRoles(['project', 'association']),
    validate(updateDepartmentSchema),
    asyncMiddleware(async (req: Request, res: Response) => {
        const { id } = req.params;

        const { department } = req.body;

        const updatedDepartment = await updateDepartment(
            parseInt(id),
            department
        );

        return res.status(200).json({
            success: true,
            message: APP_CONSTANTS.RESPONSE.DEPARTMENT.FETCH_SUCCESS,
            data: {
                updatedDepartment,
            },
        });
    })
);

export default router;
