import { IsArray, IsNotEmpty, IsNumber } from 'class-validator';

export class PermissionRolesDto {
	@IsNumber()
	@IsNotEmpty()
	roleId: number;

	@IsArray()
	permissionIds?: number[];
}
