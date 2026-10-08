import { InjectRepository } from '@nestjs/typeorm';
import {
	registerDecorator,
	ValidationArguments,
	ValidationOptions,
	ValidatorConstraint,
	ValidatorConstraintInterface,
} from 'class-validator';
import { Repository } from 'typeorm';
import { ExecutionContext, Injectable } from '@nestjs/common';
import { User } from '../../entities/usr/user.entity';

@ValidatorConstraint({ name: 'email', async: true })
@Injectable()
export class IsEmailNotRegistered implements ValidatorConstraintInterface {
	constructor(
		@InjectRepository(User)
		private userRepository: Repository<User>,
	) { }

	async validate(email: any, args: ValidationArguments) {
		const user = await this.userRepository.findOne({ where: { email } })
		return !user;
	}
}

export function EmailNotRegistered(validationOptions?: ValidationOptions) {
	return function(object: object, propertyName: string) {
		registerDecorator({
			target: object.constructor,
			propertyName: propertyName,
			options: validationOptions,
			// constraints: [],
			validator: IsEmailNotRegistered,
		});
	};
}