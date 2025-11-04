// En: src/upload/upload.controller.ts
import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Req,
  HttpException,
  HttpStatus,
  BadRequestException, 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './uploads.service';
import { Request } from 'express';

// 1. Define el filtro de archivos
const imageFileFilter = (req, file, callback) => {
  // Verifica si el 'mimetype' (tipo de archivo) empieza con 'image/'
  if (!file.mimetype.startsWith('image/')) {
    // Si no es una imagen, rechaza con un error
    return callback(
      new BadRequestException('Solo se permiten archivos de imagen.'),
      false, // 'false' significa no aceptar el archivo
    );
  }
  // Si es una imagen, acepta el archivo
  callback(null, true); // 'true' significa aceptar el archivo
};

@Controller('api/upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('productImage', {
      limits: { fileSize: 1024 * 1024 * 50 }, 
      fileFilter: imageFileFilter, 
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    if (!file) {
      // Este error ahora saltará si el filtro rechaza el archivo
      throw new HttpException('Archivo no válido.', HttpStatus.BAD_REQUEST);
    }

    // El resto de tu código...
    const { mainImageName, thumbImageName } =
      await this.uploadService.processAndSaveImage(file.buffer);

    const baseUrl = `${req.protocol}://${req.get('host')}/uploads/`;
    const mainUrl = `${baseUrl}${mainImageName}`;
    const thumbnailUrl = `${baseUrl}${thumbImageName}`;

    return {
      mainUrl: mainUrl,
      thumbnailUrl: thumbnailUrl,
    };
  }
}