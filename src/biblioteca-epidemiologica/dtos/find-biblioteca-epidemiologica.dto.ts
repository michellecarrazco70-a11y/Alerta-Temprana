import { Type } from 'class-transformer';
import {
    IsInt,
    IsOptional,
    IsString,
    Max,
    MaxLength,
    Min
} from 'class-validator';

export class FindBibliotecaDto {

    @IsOptional()
    @IsString()
    @MaxLength(100)
    patologia?: string;

    @Type(() => Number)
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(53)
    numeroSemana?: number;

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