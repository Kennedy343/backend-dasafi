import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UploadModule } from './uploads/uploads.module';

@Module({
  imports: [UploadModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
