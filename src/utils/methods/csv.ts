/**
 *
 * Converts a csv file and its entries to an array of objects.
 *
 * @param {string} csv CSV String Content
 * @returns {any[]}
 */
export const csvToJSONArray = (csv: string): any[] => {
    const lines = csv.split('\n');
    const result = [];
    const headers = lines[0].split(',');

    for (let i = 1; i < lines.length; i++) {
        const obj = {};

        if (lines[i] == undefined || lines[i].trim() == '') {
            continue;
        }

        const words = lines[i].split(',');
        for (let j = 0; j < words.length; j++) {
            obj[headers[j].trim()] = words[j].trimStart();
        }

        result.push(obj);
    }
    return result;
};
