/**
 *
 * Returns the age in number derived form a birth date Date Object.
 *
 * @param {Date} date Birth Date.
 * @returns {number} Age derived from Birth Date.
 */
export const getAgeByBirthDate = (date: Date): number => {
    return date.getFullYear() - new Date().getFullYear();
};
