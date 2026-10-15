import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min
} from 'class-validator';

export class FindRiesgosDto {

  @IsOptional()
  @IsString()
  busqueda?: string;

  @IsOptional()
  @IsIn(['mediatico', 'noticia'])
  tipo?: 'mediatico' | 'noticia';

  @IsOptional()
  @IsDateString()
  fecha?: string;

  @IsOptional()
  @IsIn(['validada', 'en_proceso_validacion'])
  estatus?: string;

  @IsOptional()
  @IsIn(['alto', 'medio', 'bajo'])
  nivelRiesgo?: string;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  skip: number = 0;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  take: number = 10;
}