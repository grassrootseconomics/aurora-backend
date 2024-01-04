import { js2xml, xml2js } from 'xml-js';

export const convertObjectToXml = (obj: any): string => {
    return js2xml(obj, { compact: true, spaces: 0, fullTagEmptyElement: true });
};

/**
 *
 * Removes the padded-in text properties from js2xml conversions.
 *
 * @param obj Object to parse through.
 * @returns
 */
const removeTextProperties = (obj: any) => {
    if (typeof obj === 'object' && obj !== null) {
        if (Array.isArray(obj)) {
            for (let i = 0; i < obj.length; i++) {
                removeTextProperties(obj[i]);
            }
        } else {
            for (const key in obj) {
                if (key === '_text') {
                    obj = obj[key];
                    break;
                } else {
                    obj[key] = removeTextProperties(obj[key]);
                }
            }
        }
    }
    return obj;
};

/**
 *
 * Replaces empty `{}` type props with empty strings.
 *
 * @param obj The object to parse and replace through.
 * @returns
 */
function replaceEmptyObjectsWithEmptyStrings(obj) {
    if (typeof obj === 'object') {
        if (Array.isArray(obj)) {
            return obj.map((item) => replaceEmptyObjectsWithEmptyStrings(item));
        } else {
            const newObj = {};
            for (const key in obj) {
                newObj[key] = replaceEmptyObjectsWithEmptyStrings(obj[key]);
                if (Object.keys(newObj[key]).length === 0) {
                    newObj[key] = '';
                }
            }
            return newObj;
        }
    }
    return obj;
}

export const convertXmlToObject = (xml: string) => {
    const obj = xml2js(xml, { compact: true });

    const minimizedObj = removeTextProperties(obj);

    const parsedObj = replaceEmptyObjectsWithEmptyStrings(minimizedObj);

    return parsedObj;
};
