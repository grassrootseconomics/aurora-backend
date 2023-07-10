import { NextFunction, Request, Response } from 'express';

import { IResponseStructure } from '../utils/types/server';

type FnContent = (
    req: Request,
    res: Response<IResponseStructure>,
    next?: NextFunction
) => unknown;

export default (fn: FnContent) =>
    (
        req: Request,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        res: Response<IResponseStructure, Record<string, any>>,
        next: NextFunction
    ) => {
        Promise.resolve(fn(req, res, next)).catch((err) => {
            if (next) return next(err);
        });
    };
