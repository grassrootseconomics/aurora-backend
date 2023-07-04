import { js2xml, xml2js } from 'xml-js';

export const convertObjectToXml = (obj: any): string => {
    return js2xml(obj, { compact: true, spaces: 0 });
};

export const convertXmlToObject = (xml: string) => {
    return xml2js(xml, { compact: true });
};
