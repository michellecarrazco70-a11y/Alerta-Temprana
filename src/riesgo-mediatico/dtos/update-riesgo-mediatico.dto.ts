import { PartialType } from '@nestjs/mapped-types';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

import { CreateRiesgoMediaticoDto } from './create-riesgo-mediatico.dto';

export class UpdateRiesgoMediaticoDto
  extends PartialType(CreateRiesgoMediaticoDto) {

  // Permite quitar los archivos sin subir otros.
  @Transform(({ value }) =>
    value === true || value === 'true'
  )
  @IsOptional()
  @IsBoolean()
  limpiarArchivos?: boolean;
}