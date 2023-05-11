import { Request, NextFunction, Response } from 'express';

export interface IResponseStructure {
    success: boolean;
    message: string;
    // eslint-disable-next-line
    data?: any;
    // eslint-disable-next-line
    error?: any;
}

export type FnContent = (
    req: Request,
    res: Response<IResponseStructure>,
    next: NextFunction
) => unknown;
