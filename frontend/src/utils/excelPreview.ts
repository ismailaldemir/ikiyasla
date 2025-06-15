import * as XLSX from 'xlsx';

export function getExcelPreview(file: File, maxRows = 10, sheetName?: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = sheetName && workbook.SheetNames.includes(sheetName) ? sheetName : workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheet];
      const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      resolve(json.slice(0, maxRows));
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
