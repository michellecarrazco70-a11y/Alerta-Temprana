import { PartialType } from '@nestjs/mapped-types';
import { User } from '../../entities';

export class UserRequest extends PartialType(User) {
	permissionsIds: number[]
	constructor(partial: Partial<UserRequest>) {
		super()
		Object.assign(this, partial)
	}
}