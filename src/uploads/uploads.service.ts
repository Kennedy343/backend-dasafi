import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs';

// Define el directorio de 'uploads' en la raíz del proyecto
const uploadDir = path.join(process.cwd(), 'uploads');

// Asegura que el directorio 'uploads' exista al iniciar el servicio
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

@Injectable()
export class UploadService {
  // Un "Logger" para registrar advertencias o errores en la consola
  private readonly logger = new Logger(UploadService.name);

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
      this.logger.error('Error al procesar la imagen', error.stack);
      throw new HttpException(
        'Error al procesar la imagen.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Borra un archivo físicamente del disco duro.
   * Recibe el nombre del archivo (ej. "1678886400000-123456789-main.webp")
   */
  async deleteFile(filename: string): Promise<void> {
    if (!filename) {
      return; // No hacer nada si el nombre está vacío
    }

    try {
      const filePath = path.join(uploadDir, filename);

      // fs.promises.unlink es el comando de Node.js para "borrar archivo"
      await fs.promises.unlink(filePath);
    } catch (error) {
      // Si el archivo no existía (error 'ENOENT'), no es un error crítico.
      // Solo lo registramos en el log y continuamos.
      if (error.code === 'ENOENT') {
        this.logger.warn(`Intento de borrar archivo no encontrado: ${filename}`);
      } else {
        // Para cualquier otro error, sí lo registramos como un error
        this.logger.error(`Error al borrar archivo ${filename}`, error.stack);
        throw new HttpException(
          'Error al borrar el archivo del servidor.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  /**
   * UTILIDAD: Extrae el nombre del archivo de una URL completa.
   * ej: "http://localhost:3000/uploads/archivo.webp" -> "archivo.webp"
   */
  public getFilenameFromUrl(url: string): string | null {
    if (!url) return null;
    try {
      // Usa el constructor de URL nativo de Node.js
      const parsedUrl = new URL(url);
      // path.basename extrae la última parte de la ruta (el nombre del archivo)
      return path.basename(parsedUrl.pathname);
    } catch (error) {
      this.logger.warn(`URL inválida, no se pudo extraer el nombre: ${url}`);
      return null;
    }
  }
}