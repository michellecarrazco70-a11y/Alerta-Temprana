import { Type } from 'class-transformer';
import {
	IsDateString,
	IsInt,
	IsOptional,
	IsString,
	Matches,
	Max,
	Min
} from 'class-validator';

export class FindAlertasTempranasDto {

	@IsOptional()
	@IsString()
	busqueda?: string;

	@IsOptional()
	@IsString()
	patologia?: string;

	@IsOptional()
	@IsDateString()
	@Matches(/^\d{4}-\d{2}-\d{2}$/)
	fecha?: string;

	@IsOptional()
	@IsString()
	municipio?: string;

	@IsOptional()
	@IsString()
	localidad?: string;

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