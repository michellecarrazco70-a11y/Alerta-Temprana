import { PartialType } from '@nestjs/mapped-types';
import { IsEmail, IsString, IsOptional, IsObject } from 'class-validator';
import { appPassword } from '../../common/validators/password.validator';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) { 
	@IsString()
	@IsEmail()
	email: string;

	@IsOptional()
	@IsObject()
	redTroncalPerfil?: {
		layers: Array<{
			id: string | number;
			can_read: boolean;
			can_write: boolean;
		}>;
	};
	
	// @IsString()
	// @appPassword(false)
	// password?: string;
}
