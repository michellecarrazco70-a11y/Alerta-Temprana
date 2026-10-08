import { IsNotEmpty } from 'class-validator';
import { IsArray, IsOptional, IsString } from 'class-validator';
import { UniqueRoleName } from '../../common/validators/unique-role-name.validator';

export class CreateRoleDto {
	@IsString()
	@IsNotEmpty()
	@UniqueRoleName({ message: 'El rol ya existe' })
	name: string;

	@IsString()
	@IsNotEmpty()
	desc: string;

	@IsOptional()
	@IsString()
	route: string;

	@IsOptional()
	@IsArray()
	permissionsIds?: number[];
}
