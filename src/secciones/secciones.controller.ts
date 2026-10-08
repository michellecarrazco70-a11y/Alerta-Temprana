import { Controller, Get } from '@nestjs/common';
import { SeccionesService } from './secciones.service';

@Controller('secciones')
export class SeccionesController {
  constructor(private readonly seccionesService: SeccionesService) {}

  @Get()
  findAll() {
    return this.seccionesService.getSeccionesFromRemoteDb();
  }
}
