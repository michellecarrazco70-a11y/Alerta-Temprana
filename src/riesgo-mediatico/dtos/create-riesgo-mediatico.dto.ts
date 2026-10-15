import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength
} from 'class-validator';

import { Transform } from 'class-transformer';

import {
  TipoRiesgo,
  EstatusRiesgo,
  ClasificacionRiesgo,
  NivelRiesgo
} from '../../entities/usr/riesgo-mediatico.entity';

const nullable = ({ value }: { value: unknown }) =>
  value === '' ? null : value;

export class CreateRiesgoMediaticoDto {

  @IsIn(['mediatico', 'noticia'])
  tipo: TipoRiesgo;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  titulo: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(191)
  fuente: string;

  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  fecha: string;

  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  link: string;

  @Transform(nullable)
  @IsOptional()
  @IsIn(['validada', 'en_proceso_validacion'])
  estatus?: EstatusRiesgo | null;

  @Transform(nullable)
  @IsOptional()
  @IsIn(['Confirmada', 'Falsa'])
  clasificacion?: ClasificacionRiesgo | null;

  @Transform(nullable)
  @IsOptional()
  @IsIn(['Alto', 'Medio', 'Bajo'])
  nivelRiesgo?: NivelRiesgo | null;

  @Transform(({ value }) =>
    value === true || value === 'true'
  )
  @IsOptional()
  @IsBoolean()
  tendencia?: boolean;

  @Transform(nullable)
  @IsOptional()
  @IsString()
  descripcion?: string | null;
}