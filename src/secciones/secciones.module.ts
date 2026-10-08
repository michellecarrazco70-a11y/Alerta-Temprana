import { Module } from '@nestjs/common';
import { SeccionesService } from './secciones.service';
import { SeccionesController } from './secciones.controller';

@Module({
  controllers: [SeccionesController],
  providers: [SeccionesService]
})
export class SeccionesModule {}
