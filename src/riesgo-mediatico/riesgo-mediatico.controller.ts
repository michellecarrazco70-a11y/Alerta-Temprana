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

import { RiesgoMediaticoService } from './riesgo-mediatico.service';
import { CreateRiesgoMediaticoDto } from './dtos/create-riesgo-mediatico.dto';
import { UpdateRiesgoMediaticoDto } from './dtos/update-riesgo-mediatico.dto';
import { FindRiesgosDto } from './dtos/find-riesgos.dto';



@Controller('riesgos-mediaticos')
export class RiesgoMediaticoController {

  constructor(
    private readonly riesgosService: RiesgoMediaticoService
  ) {}

  @Post()
  @UseInterceptors(
    FilesInterceptor('archivos', 5, {
      limits: { fileSize: 10 * 1024 * 1024 }
    })
  )
  create(
    @Body() dto: CreateRiesgoMediaticoDto,
    @UploadedFiles() archivos: Express.Multer.File[],
    @GetCurrentUserId() userId: number
  ) {
    return this.riesgosService.create(dto, userId, archivos);
  }

  @Get()
  findAll(@Query() filters: FindRiesgosDto) {
    return this.riesgosService.findAll(filters);
  }

  @Get(':uuid/media/:mediaId')
  async descargarMedia(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Param('mediaId', ParseIntPipe) mediaId: number,
    @Res({ passthrough: true }) res: Response
  ): Promise<StreamableFile> {

    const media = await this.riesgosService.getMedia(uuid, mediaId);

    res.setHeader('Content-Type', media.mimeType);
    res.setHeader('X-Content-Type-Options', 'nosniff');

    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(media.nombreArchivo)}`
    );

    res.setHeader('Content-Length', media.sizeBytes.toString());

    return new StreamableFile(media.archivo);
  }

  @Delete(':uuid/media/:mediaId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeMedia(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Param('mediaId', ParseIntPipe) mediaId: number,
    @GetCurrentUserId() userId: number
  ): Promise<void> {
    return this.riesgosService.removeMedia(uuid, mediaId, userId);
  }

  @Get(':uuid')
  findOne(@Param('uuid', ParseUUIDPipe) uuid: string) {
    return this.riesgosService.findOne(uuid);
  }

  @Patch(':uuid/editar')
  @UseInterceptors(
    FilesInterceptor('archivos', 5, {
      limits: { fileSize: 10 * 1024 * 1024 }
    })
  )
  update(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() dto: UpdateRiesgoMediaticoDto,
    @UploadedFiles() archivos: Express.Multer.File[],
    @GetCurrentUserId() userId: number
  ) {
    return this.riesgosService.update(
      uuid, dto, userId, archivos
    );
  }

  @Delete(':uuid/eliminar')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @GetCurrentUserId() userId: number
  ): Promise<void> {
    return this.riesgosService.remove(uuid, userId);
  }
}