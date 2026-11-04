import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsUUID,
  Matches,
  Max,
  Min
} from 'class-validator';

// El frontend puede mandar '' en filtros vacíos; lo tratamos como "sin filtro".
const emptyToUndefined = ({ value }: { value: unknown }) =>
  value === '' ? undefined : value;

export class FindEntrevistasDto {

  @Transform(emptyToUndefined)
  @IsOptional()
  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  fecha?: string;

  @Transform(emptyToUndefined)
  @IsOptional()
  @IsUUID()
  voceriaUuid?: string;

  @Transform(emptyToUndefined)
  @IsOptional()
  @IsUUID()
  medioUuid?: string;

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