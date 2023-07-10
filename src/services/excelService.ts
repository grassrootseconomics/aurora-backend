import ExcelJS, { Column } from 'exceljs';

export function generateExcel(data: object[]) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Data');

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
}