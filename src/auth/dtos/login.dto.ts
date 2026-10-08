import { IdName } from '../../common/interfaces/commons.interface';
import { User } from '../../entities/usr/user.entity';

export class LoginDto {
	user: UserLoginDto;
	permissions: IdName[];
	roles: string[];
	accessToken: string;
	refreshToken: string;
	constructor(user: User) {
		this.user = {
			id: user.id,
			name: user.name,
			firstName: user.firstName,
			secondName: user.secondName,
			email: user.email,
			uuid: user.uuid
		};
	}
}

export interface UserLoginDto {
	id: number;
	name: string;
	firstName: string;
	secondName?: string;
	email: string;
	uuid: string;
}
