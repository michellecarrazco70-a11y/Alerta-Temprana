import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFiles,
  UseInterceptors
} from '@nestjs/common';

import { FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';

import { GetCurrentUserId } from '../common/decorators/commons.decorator';

import { BibliotecaEpidemiologicaService } from './biblioteca-epidemiologica.service';
import { CreateBibliotecaEpidemiologicaDto } from './dtos/create-biblioteca-epidemiologica.dto';
import { UpdateBibliotecaEpidemiologicaDto } from './dtos/update-biblioteca-epidemiologica.dto';
import { FindBibliotecaDto } from './dtos/find-biblioteca-epidemiologica.dto';

// Registrar el permiso del módulo en access.enum y aplicar
// aquí el decorador @Permissions(...) correspondiente.
// Las rutas deben estar protegidas por la autenticación existente.

@Controller('biblioteca-epidemiologica')
export class BibliotecaEpidemiologicaController {

  constructor(
    private readonly bibliotecaService: BibliotecaEpidemiologicaService
  ) {}

  @Post()
  @UseInterceptors(
    FilesInterceptor('archivos', 10, {
      limits: { fileSize: 10 * 1024 * 1024 }
    })
  )
  create(
    @Body() dto: CreateBibliotecaEpidemiologicaDto,
    @UploadedFiles() archivos: Express.Multer.File[],
    @GetCurrentUserId() userId: number
  ) {
    return this.bibliotecaService.create(dto, userId, archivos);
  }

  @Get()
  findAll(@Query() filters: FindBibliotecaDto) {
    return this.bibliotecaService.findAll(filters);
  }

  // Funcion para el catalofo de las patologias
  @Get('patologias')
  getPatologias() {
    return this.bibliotecaService.getPatologias();
  }

  // :uuid = uuid de la semana y el :informeId = id del informe
  @Get(':uuid/informes/:informeId')
  async descargarInforme(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Param('informeId', ParseIntPipe) informeId: number,
    @Res({ passthrough: true }) res: Response
  ): Promise<StreamableFile> {

    const informe = await this.bibliotecaService.getInforme(uuid, informeId);

    res.setHeader('Content-Type', informe.mimeType);
    res.setHeader('X-Content-Type-Options', 'nosniff');

    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(informe.nombreArchivo)}`
    );

    res.setHeader('Content-Length', informe.sizeBytes.toString());

    return new StreamableFile(informe.archivo);
    //return new StreamableFile(new Uint8Array(informe.archivo));


  }

  // elimina un solo informe. si la semana se queda sin informes,
  // la semana también se elimina.
  @Delete(':uuid/informes/:informeId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeInforme(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Param('informeId', ParseIntPipe) informeId: number,
    @GetCurrentUserId() userId: number
  ): Promise<void> {
    return this.bibliotecaService.removeInforme(uuid, informeId, userId);
  }

  @Get(':uuid')
  findOne(@Param('uuid', ParseUUIDPipe) uuid: string) {
    return this.bibliotecaService.findOne(uuid);
  }

  @Patch(':uuid/editar')
  @UseInterceptors(
    FilesInterceptor('archivos', 10, {
      limits: { fileSize: 10 * 1024 * 1024 }
    })
  )
  update(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() dto: UpdateBibliotecaEpidemiologicaDto,
    @UploadedFiles() archivos: Express.Multer.File[],
    @GetCurrentUserId() userId: number
  ) {
    return this.bibliotecaService.update(uuid, dto, userId, archivos);
  }

  // Elimina la semana completa con todos sus informes.
  @Delete(':uuid/eliminar')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @GetCurrentUserId() userId: number
  ): Promise<void> {
    return this.bibliotecaService.remove(uuid, userId);
  }
}