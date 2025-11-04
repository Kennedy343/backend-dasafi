import { Module } from '@nestjs/common';
import { UploadController } from './uploads.controller';
import { UploadService } from './uploads.service';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

@Module({
  imports: [
    // Configuración de Multer para usar 'memoryStorage'
    // ya que sharp procesará el buffer en memoria.
    MulterModule.register({
      storage: memoryStorage(),
    }),
  ],
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService], // <-- ¡CRUCIAL! Para que otros módulos puedan usarlo
})
export class UploadModule {}