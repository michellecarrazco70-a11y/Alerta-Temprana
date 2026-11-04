import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query
} from '@nestjs/common';

import { GetCurrentUserId } from '../common/decorators/commons.decorator';

import { EntrevistasService } from './entrevistas.service';
import { CreateEntrevistaDto } from './dtos/create-entrevista.dto';
import { UpdateEntrevistaDto } from './dtos/update-entrevista.dto';
import { FindEntrevistasDto } from './dtos/find-entrevistas.dto';

// Sin @Permissions: acordado con el encargado, cualquier usuario autenticado puede usarlo.
@Controller('entrevistas')
export class EntrevistasController {

  constructor(private readonly entrevistasService: EntrevistasService) {}

  @Post()
  create(@Body() dto: CreateEntrevistaDto, @GetCurrentUserId() userId: number) {
    return this.entrevistasService.create(dto, userId);
  }

  @Get()
  findAll(@Query() filters: FindEntrevistasDto) {
    return this.entrevistasService.findAll(filters);
  }

  @Get(':uuid')
  findOne(@Param('uuid', ParseUUIDPipe) uuid: string) {
    return this.entrevistasService.findOne(uuid);
  }

  @Patch(':uuid')
  update(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() dto: UpdateEntrevistaDto,
    @GetCurrentUserId() userId: number
  ) {
    return this.entrevistasService.update(uuid, dto, userId);
  }

  @Delete(':uuid')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @GetCurrentUserId() userId: number
  ): Promise<void> {
    return this.entrevistasService.remove(uuid, userId);
  }
}