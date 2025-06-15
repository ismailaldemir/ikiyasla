import { Controller, Post, UploadedFile, UploadedFiles, UseInterceptors, Body } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import * as XLSX from 'xlsx';
import { ExcelService } from './excel.service';

@Controller('excel')
export class ExcelController {
  constructor(private readonly excelService: ExcelService) {}
  @Post('compare')
  @UseInterceptors(FilesInterceptor('files', 2))
  async compareExcels(
    @UploadedFiles() files: any[],
    @Body() body: any
  ) {
    if (!files || files.length < 2) return { error: 'İki dosya yükleyin' };
    const {
      headerRow1 = 0,
      headerRow2 = 0,
      codeCol1 = '',
      priceCol1 = '',
      nameCol1 = '',
      codeCol2 = '',
      priceCol2 = '',
      nameCol2 = '',
      sheetName1 = '',
      sheetName2 = ''
    } = body;
    const result = this.excelService.compareExcels(
      files[0].buffer,
      files[1].buffer,
      {
        headerRow1: Number(headerRow1),
        headerRow2: Number(headerRow2),
        codeCol1,
        priceCol1,
        nameCol1,
        codeCol2,
        priceCol2,
        nameCol2,
        sheetName1,
        sheetName2
      }
    );
    return { differences: result };
  }
  @Post('preview')
  @UseInterceptors(FileInterceptor('file'))
  async previewExcel(@UploadedFile() file: any, @Body() body: any) {
    if (!file) return { error: 'Dosya bulunamadı' };
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetNames = workbook.SheetNames;
    const sheetName = (body && body.sheetName && sheetNames.includes(body.sheetName)) ? body.sheetName : sheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    return { preview: json.slice(0, 10), sheetNames };
  }
}
