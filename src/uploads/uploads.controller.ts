import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Req,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './uploads.service';
import { Request } from 'express';

@Controller('api/upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('productImage', { // 'productImage' es el nombre del campo
    limits: { fileSize: 1024 * 1024 * 25 }, // Límite de 25MB
  }))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request, // Usamos Req para construir la URL base
  ) {
    if (!file) {
      throw new HttpException('Archivo no encontrado.', HttpStatus.BAD_REQUEST);
    }

    // 1. Llama al servicio para hacer el trabajo pesado
    const { mainImageName, thumbImageName } =
      await this.uploadService.processAndSaveImage(file.buffer);

    // 2. Construye las URLs públicas
    const baseUrl = `${req.protocol}://${req.get('host')}/uploads/`;
    const mainUrl = `${baseUrl}${mainImageName}`;
    const thumbnailUrl = `${baseUrl}${thumbImageName}`;

    // 3. Devuelve las URLs al frontend
    return {
      mainUrl: mainUrl,
      thumbnailUrl: thumbnailUrl,
    };
  }
}