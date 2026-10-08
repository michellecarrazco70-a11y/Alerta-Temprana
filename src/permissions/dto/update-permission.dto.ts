import { IsString, IsOptional, IsNumber, IsPositive } from 'class-validator';

export class UpdatePermissionDto {
	@IsOptional()
	@IsString()
	name: string;

	@IsString()
	@IsOptional()
	route: string;

	@IsOptional()
	@IsNumber()
	@IsPositive()
	groupId: number;
}
