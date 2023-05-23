import { NextFunction, Request, Response } from 'express';

import Joi from 'joi';

/**
 * Default API Response Structure.
 */
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

/**
 * Default Search Parameter Filters.
 */
export interface ISearchParameters {
    /**
     * Search string a user inputs.
     */
    search: string;
    /**
     * The number of items to paginate on a single page.
     */
    limit: number;
    /**
     * The current page number;
     */
    index: number;
}

/**
 * Generic Search Result Type.
 */
export interface ISearchResult<TData> {
    /**
     * The returned data.
     */
    data: TData[];
    /**
     * Number of total pages for the data.
     */
    totalPages: number;
    /**
     * The current page number.
     */
    page: number;
    /**
     * Number of total entries of the data type.
     */
    totalEntries: number;
}

export type DefaultValidation = {
    query?: Joi.Schema;
    body?: Joi.Schema;
    params?: Joi.Schema;
};

export type JWTToken = {
    address: string;
    key: string;
    role: 'Buyer' | 'Producer' | 'Project';
    name: string;
    type: 'ACCESS' | 'REFRESH';
    exp: number;
    iat: number;
    iss: string;
};
