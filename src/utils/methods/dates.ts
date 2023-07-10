/**
 *
 * Returns the conversion of an eligible string to a Date.
 *
 * @param {string} str String to convert.
 * @returns {Date}
 */
export const convertStringToDate = (str: string): Date => {
    const unixTimeZero = Date.parse(str);
    if (isNaN(unixTimeZero)) return new Date();
    return new Date(unixTimeZero);
};
