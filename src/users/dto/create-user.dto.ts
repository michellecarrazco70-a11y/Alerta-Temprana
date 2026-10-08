import { IsString, IsEmail, IsOptional, IsObject, IsNumber, IsArray, MaxLength, } from 'class-validator';

import { EmailNotRegistered } from '../../common/validators/email-validation';
import { appPassword } from '../../common/validators/password.validator';
import { appLength } from '../../common/validators/app-length.validator';

export class CreateUserDto {
	@IsString()
	org: string;
	
	@IsString()
	password: string;

	@IsString()
	puesto: string;

	@IsString()
	name: string;

	@IsOptional()
	@IsObject()
	redTroncalPerfil?: {
		profile_id?: string | number | null;
		layers: Array<{
			id: string | number;
			can_read: boolean;
			can_write: boolean;
		}>;
	};

	@IsString()
	firstName: string;

	@IsString()
	@IsOptional()
	secondName: string;

	@IsString()
	@IsEmail()
	@EmailNotRegistered({ message: 'El correo ya se encuentra registrado' })
	email: string;
	
	@IsArray()
	@IsOptional()
	roleIds?: number[];
}
