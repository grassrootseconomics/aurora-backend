import { csvToJSONArray } from './csv';

export const parseCSVFileToJSONArray = <T>(csvfile: string): T[] =>
    csvToJSONArray(csvfile) as T[];
