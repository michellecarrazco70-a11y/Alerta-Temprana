import { IsOptional, IsString } from "class-validator";
import { appPassword } from '../../common/validators/password.validator';

export class EditProfileDto {
	// @IsString()
	// @appIsEmail()
	// email: string;

	@IsString()
	@IsOptional()
	@appPassword(false)
	password: string;
}
