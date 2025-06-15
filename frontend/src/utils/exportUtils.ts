import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export function exportToExcel(data: any[], filename = 'fiyat-farklari.xlsx') {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Farklar');
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
  saveAs(blob, filename);
}

export function exportToPDF(data: any[], filename = 'fiyat-farklari.pdf') {
  const doc = new jsPDF();
  const columns = [
    { header: 'Kod', dataKey: 'code' },
    { header: 'Fiyat 1', dataKey: 'price1' },
    { header: 'Fiyat 2', dataKey: 'price2' },
  ];
  // @ts-ignore
  doc.autoTable({ columns, body: data });
  doc.save(filename);
}
