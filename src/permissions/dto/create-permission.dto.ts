import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { UniquePermissionName } from '../../common/validators/unique-permission-name.validator';

export class CreatePermissionDto {
  @IsString()
  @IsNotEmpty()
  @UniquePermissionName({ message: "permission name already exists"})
  name: string;

  @IsString()
  @IsOptional()
  route: string;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  groupId: number;
}
