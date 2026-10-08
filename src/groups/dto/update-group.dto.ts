import { IsOptional, IsString, IsNumber } from 'class-validator';

export class UpdateGroupDto {

	@IsString()
	@IsOptional()
	name: string;

	@IsNumber()
	@IsOptional()
	order: number;

}
