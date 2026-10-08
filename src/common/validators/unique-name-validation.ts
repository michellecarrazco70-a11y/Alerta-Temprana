import { InjectRepository } from '@nestjs/typeorm';
import {
	registerDecorator,
	ValidationArguments,
	ValidationOptions,
	ValidatorConstraint,
	ValidatorConstraintInterface,
} from 'class-validator';
import { Repository } from 'typeorm';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ERRORS } from '../constants/errors.const';
import { User } from '../../entities/usr/user.entity';

@ValidatorConstraint({ name: 'name', async: true })
export class IsNameUnique implements ValidatorConstraintInterface {
	constructor(
		@InjectRepository(User)
		private userRepository: Repository<User>
	) { }

	validate(name: any, args: ValidationArguments) {
		return this.userRepository.findOne({ where: { name } }).then(user => {
			if (user) throw new HttpException(ERRORS.Validation_errors.ERR012, HttpStatus.BAD_REQUEST);
			return true;
		});
	}
}

export function UniqueName(validationOptions?: ValidationOptions) {
	return function(object: object, propertyName: string) {
		registerDecorator({
			target: object.constructor,
			propertyName: propertyName,
			options: validationOptions,
			constraints: [],
			validator: IsNameUnique,
		});
	};
}