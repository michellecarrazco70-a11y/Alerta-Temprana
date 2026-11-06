import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class FindAlertasTempranasDto {
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(0)
	skip?: number;

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	take?: number;

	@IsOptional()
	@IsString()
	busqueda?: string;

	@IsOptional()
	@IsString()
	patologia?: string;

	@IsOptional()
	@IsString()
	fecha?: string;

	@IsOptional()
	@IsString()
	municipio?: string;

	@IsOptional()
	@IsString()
	localidad?: string;
}