import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import sharp from 'sharp'; 
import * as path from 'path';
import * as fs from 'fs';

// Asegurarse de que la carpeta 'uploads' exista
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

@Injectable()
export class UploadService {
  
  /**
   * Procesa un buffer de imagen, crea una versión principal y un thumbnail,
   * los guarda en /uploads y devuelve los nombres de archivo.
   */
  async processAndSaveImage(
    fileBuffer: Buffer,
  ): Promise<{ mainImageName: string; thumbImageName: string }> {
    try {
      // 1. Generar un nombre base único
      const baseName = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

      // 2. Definir nombres y rutas de salida
      const mainImageName = `${baseName}-main.webp`;
      const thumbImageName = `${baseName}-thumb.webp`;

      const mainImagePath = path.join(uploadDir, mainImageName);
      const thumbImagePath = path.join(uploadDir, thumbImageName);

      // 3. Instanciar Sharp
      const sharpInstance = sharp(fileBuffer);

      // 4. Procesar y guardar ambas imágenes en paralelo
      await Promise.all([
        // Versión Principal (1200px, 80% calidad)
        sharpInstance
          .clone()
          .resize(1200) // Redimensionar a 1200px de ancho (mantiene aspect ratio)
          .webp({ quality: 80 })
          .toFile(mainImagePath),

        // Versión Thumbnail (200x200, recortada)
        sharpInstance
          .clone()
          .resize(200, 200, { fit: 'cover' }) // Recorta para ajustar a 200x200
          .webp({ quality: 70 })
          .toFile(thumbImagePath),
      ]);

      // 5. Devolver solo los nombres de archivo
      return { mainImageName, thumbImageName };
      
    } catch (error) {
      console.error(error);
      throw new HttpException(
        'Error al procesar la imagen.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}