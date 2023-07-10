import { js2xml, xml2js } from 'xml-js';

export const convertObjectToXml = (obj: any): string => {
    return js2xml(obj, { compact: true, spaces: 0 });
};

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

export const convertXmlToObject = (xml: string) => {
    const obj = xml2js(xml, { compact: true });

    return removeTextProperties(obj);
};
