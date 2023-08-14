import ExcelJS, { Column } from 'exceljs';

/**
 *
 * Generates and returns an excel with the data worksheet title as 'Available'.
 *
 * @param data Data to display in excell.
 * @returns
 */
export const generateAvailableBatchesExcel = (data: object[]) => {
    return generateExcel(data, 'Available');
};

/**
 *
 * Generates and returns an excel with the data worksheet title as 'Sold'.
 *
 * @param data Data to display in excell.
 * @returns
 */
export const generateSoldBatchesExcel = (data: object[]) => {
    return generateExcel(data, 'Sold');
};

/**
 *
 * Generates and returns an excel with the data worksheet title as 'Producers'.
 *
 * @param data Data to display in excell.
 * @returns
 */
export const generateProducersExcel = (data: object[]) => {
    return generateExcel(data, 'Producers');
};

/**
 *
 * Generates an ExcelJS Workbook with a single titled worksheet.
 *
 * @param data Data to display in excell.
 * @param worksheetTitle Title to give to worksheet
 * @returns
 */
export const generateExcel = (data: object[], worksheetTitle: string) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(worksheetTitle);

    const keys = Array.from(new Set(data.flatMap(Object.keys))) as string[];

    // Set up column headers
    const columns = keys.map((key) => ({
        header: key,
        key,
        width: 20,
    })) as Column[];

    worksheet.columns = columns;

    // Add data to the worksheet
    data.forEach((item) => {
        const row = {} as Record<string, any>;
        keys.forEach((key) => {
            row[key] = item[key] ?? '';
        });
        worksheet.addRow(row);
    });

    return workbook;
};
