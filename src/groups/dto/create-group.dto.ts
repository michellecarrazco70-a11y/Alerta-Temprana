import {
	IsArray,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsPositive,
	IsString,
} from 'class-validator';
import { UniqueGroupName } from '../../common/validators/unique-group-name.validator';

export class CreateGroupDto {
	@IsString()
	@IsNotEmpty()
	@UniqueGroupName({ message: "group name already exists" })
	name: string;

	@IsOptional()
	@IsNumber()
	@IsPositive()
	order: number;

	@IsArray()
	@IsOptional()
	@IsNumber()
	permissionIds?: number[];
}
