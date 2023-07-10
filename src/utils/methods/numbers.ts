import { Prisma } from '@prisma/client';

/**
 *
 * Converts a stringified number into a Prisma Decimal.
 *
 * @param {string} str Stringified number to convert.
 * @returns {Prisma.Decimal}
 */
export const convertStringToDecimal = (str: string): Prisma.Decimal => {
    const num = parseFloat(str);

    if (isNaN(num)) {
        return new Prisma.Decimal(0);
    } else {
        return new Prisma.Decimal(num);
    }
};

/**
 * Converts and checks for isNaN.
 *
 * If the converted string is NaN, it returns 0 instead.
 *
 * @param {string} str Strigified Version of Number.
 * @returns {number} Parsed Number;
 */
export const convertStringToNumber = (str: string): number => {
    const int = parseFloat(str);

    return isNaN(int) ? 0 : int;
};
