import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  Post
} from '@nestjs/common';

import { GetCurrentUserId } from '../common/decorators/commons.decorator';

import { CatalogosService, TipoCatalogo } from './catalogos.service';
import { CreateCatalogoDto } from './dtos/create-catalogo.dto';

// TODO: agregar @Permissions(...) cuando se defina el id del permiso.

@Controller('entrevistas/catalogos')
export class CatalogosController {

  constructor(private readonly catalogosService: CatalogosService) {}

  @Get(':tipo')
  findAll(
    @Param('tipo', new ParseEnumPipe(TipoCatalogo)) tipo: TipoCatalogo
  ) {
    return this.catalogosService.findAll(tipo);
  }

  @Post(':tipo')
  create(
    @Param('tipo', new ParseEnumPipe(TipoCatalogo)) tipo: TipoCatalogo,
    @Body() dto: CreateCatalogoDto,
    @GetCurrentUserId() userId: number
  ) {
    return this.catalogosService.createOrGet(tipo, dto.nombre, userId);
  }
}