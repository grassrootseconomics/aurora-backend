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

/**
 *
 * Returns the number of days between two dates.
 *
 * @param {Date} dat1 Later Date.
 * @param {Date} dat2 Earlier Date
 * @returns
 */
export const getNrOfDaysBetweenDates = (dat1: Date, dat2: Date) => {
    const dayInMilliseconds = 1000 * 60 * 60 * 24;

    return parseInt(
        ((dat1.getTime() - dat2.getTime()) / dayInMilliseconds).toString()
    );
};
