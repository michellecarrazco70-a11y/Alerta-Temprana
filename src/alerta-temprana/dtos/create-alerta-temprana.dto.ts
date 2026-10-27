import {
	IsDateString,
	IsInt,
	IsNotEmpty,
	IsOptional,
	IsString,
	Matches,
	MaxLength,
	Min
} from 'class-validator';

import { Transform, Type } from 'class-transformer';

const nullable = ({ value }: { value: unknown }) =>
	value === '' ? null : value;

export class CreateAlertaTempranaDto {

	@IsString()
	@IsNotEmpty()
	@MaxLength(191)
	patologia: string;

	@IsDateString()
	@Matches(/^\d{4}-\d{2}-\d{2}$/)
	fecha: string;

	@IsString()
	@IsNotEmpty()
	@MaxLength(150)
	municipio: string;

	@Transform(nullable)
	@IsOptional()
	@IsString()
	@MaxLength(191)
	localidad?: string | null;

	@Type(() => Number)
	@IsInt()
	@Min(0)
	numeroCasos: number;
}