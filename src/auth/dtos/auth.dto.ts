import { IsNotEmpty, IsString } from 'class-validator';
import { appIsEmail } from '../../common/decorators/class-validator-resets.decorator';
import { appPassword } from '../../common/validators/password.validator';

export class AuthDto {
	@IsNotEmpty()
	@IsString()
	@appIsEmail()
	email: string;

	@IsNotEmpty()
	@IsString()
	password: string;
}

export class RequestResetPasswordReqDTO {
	@IsNotEmpty()
	@appIsEmail()
	email: string;
}
export class resetPasswordReqDTO {
	@IsNotEmpty()
	@appPassword()
	password: string;
	@IsNotEmpty()
	@IsString()
	token: string;
}