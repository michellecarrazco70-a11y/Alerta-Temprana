import { IsOptional, IsString, } from 'class-validator';

export class UpdateRoleDto {
	@IsString()
	name: string;

	@IsString()
	desc: string;

	@IsString()
	@IsOptional()
	route: string;

}