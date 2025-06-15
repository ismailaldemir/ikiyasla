
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ExcelController } from './excel/excel.controller';
import { ExcelService } from './excel/excel.service';

@Module({
  imports: [],
  controllers: [AppController, ExcelController],
  providers: [AppService, ExcelService],
})
export class AppModule {}
