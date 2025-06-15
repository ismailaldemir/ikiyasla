import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';

@Injectable()
export class ExcelService {
  compareExcels(
    file1: Buffer,
    file2: Buffer,
    options: {
      headerRow1: number;
      headerRow2: number;
      codeCol1: string;
      priceCol1: string;
      codeCol2: string;
      priceCol2: string;
      nameCol1: string;
      nameCol2: string;
      sheetName1?: string;
      sheetName2?: string;
    }
  ) {
    // Parse first file
    const wb1 = XLSX.read(file1, { type: 'buffer' });
    const ws1 = wb1.Sheets[options.sheetName1 && wb1.SheetNames.includes(options.sheetName1) ? options.sheetName1 : wb1.SheetNames[0]];
    const data1 = XLSX.utils.sheet_to_json(ws1, { header: 1 });

    const headers1 = data1[options.headerRow1] as string[];
    const rows1 = data1.slice(options.headerRow1 + 1) as any[][];
    const idxCode1 = headers1.indexOf(options.codeCol1);
    const idxPrice1 = headers1.indexOf(options.priceCol1);
    const idxName1 = headers1.indexOf(options.nameCol1);
    // Üstü çizili kontrolü için yardımcı fonksiyon (hücre stilinden okur)
    function isStrikethrough(sheet: XLSX.WorkSheet, cellAddress: string): boolean {
      const cell = sheet[cellAddress];
      if (!cell) return false;
      if (cell.s && cell.s.font && cell.s.font.strike) return true;
      if (typeof cell.v === 'string' && (cell.v.includes('~~') || cell.v.includes('<s>') || cell.v.includes('<strike>'))) return true;
      return false;
    }

    // Font rengi kırmızı mı kontrolü için yardımcı fonksiyon
    function isRedFont(sheet: XLSX.WorkSheet, cellAddress: string): boolean {
      const cell = sheet[cellAddress];
      if (!cell) return false;
      if (cell.s && cell.s.font && cell.s.font.color) {
        const rgb = cell.s.font.color.rgb;
        if (rgb && (rgb.toUpperCase() === 'FF0000' || rgb.toUpperCase() === 'FFFF0000')) return true;
      }
      return false;
    }

    // Map1'e üstü çizili olanları deleted olarak işaretle (stil kontrolü)
    const map1 = new Map();
    rows1.forEach((r: any[], i: number) => {
      const code = r[idxCode1];
      const price = r[idxPrice1];
      const name = r[idxName1];
      const deleted =
        isStrikethrough(ws1, XLSX.utils.encode_cell({ c: idxCode1, r: options.headerRow1 + 1 + i })) ||
        isStrikethrough(ws1, XLSX.utils.encode_cell({ c: idxPrice1, r: options.headerRow1 + 1 + i })) ||
        isStrikethrough(ws1, XLSX.utils.encode_cell({ c: idxName1, r: options.headerRow1 + 1 + i }));
      map1.set(code, { price, name, deleted });
    });

    // Parse second file
    const wb2 = XLSX.read(file2, { type: 'buffer' });
    const ws2 = wb2.Sheets[options.sheetName2 && wb2.SheetNames.includes(options.sheetName2) ? options.sheetName2 : wb2.SheetNames[0]];
    const data2 = XLSX.utils.sheet_to_json(ws2, { header: 1 });

    const headers2 = data2[options.headerRow2] as string[];
    const rows2 = data2.slice(options.headerRow2 + 1) as any[][];
    const idxCode2 = headers2.indexOf(options.codeCol2);
    const idxPrice2 = headers2.indexOf(options.priceCol2);
    const idxName2 = headers2.indexOf(options.nameCol2);
    const map2 = new Map();
    rows2.forEach((r, i) => {
      if (i <= options.headerRow2 - 1) return;
      const code = r[idxCode2];
      const price = r[idxPrice2];
      const name = r[idxName2];
      const codeCell = XLSX.utils.encode_cell({ c: idxCode2, r: i });
      const priceCell = XLSX.utils.encode_cell({ c: idxPrice2, r: i });
      const nameCell = XLSX.utils.encode_cell({ c: idxName2, r: i });
      const isStriked = isStrikethrough(ws2, codeCell) || isStrikethrough(ws2, priceCell) || isStrikethrough(ws2, nameCell);
      const isRed = isRedFont(ws2, codeCell) || isRedFont(ws2, priceCell) || isRedFont(ws2, nameCell);
      map2.set(code, { price, name, isStriked, isRed });
    });

    const result: { code: any; name: any; price1: any; price2: any; status: string }[] = [];
    // Önce güncel dosyada üstü çizili olanları ekle
    for (const [code, val2] of map2.entries()) {
      if (val2.isStriked) {
        result.push({ code, name: val2.name, price1: undefined, price2: val2.price, status: 'strikethrough-deleted' });
      } else if (val2.isRed) {
        result.push({ code, name: val2.name, price1: undefined, price2: val2.price, status: 'color-changed' });
      }
    }
    // Sonra diğer karşılaştırmaları ekle
    for (const [code, val1] of map1.entries()) {
      const val2 = map2.get(code);
      if (val2 && val2.isStriked) continue; // üstü çizili olarak zaten eklendi
      if (!val2) {
        result.push({ code, name: val1.name, price1: val1.price, price2: undefined, status: 'deleted' });
      } else if (val1.price !== val2.price) {
        result.push({ code, name: val1.name, price1: val1.price, price2: val2.price, status: 'changed' });
      }
    }
    // Yeni eklenenler
    for (const [code, val2] of map2.entries()) {
      if (!map1.has(code) && !val2.isStriked) {
        result.push({ code, name: val2.name, price1: undefined, price2: val2.price, status: 'new' });
      }
    }
    return result;
  }
}
