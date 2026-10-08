import { InjectRepository } from '@nestjs/typeorm';
import {
	registerDecorator,
	ValidationArguments,
	ValidationOptions,
	ValidatorConstraint,
	ValidatorConstraintInterface,
} from 'class-validator';
import { Repository } from 'typeorm';

//Entities
import { Injectable } from '@nestjs/common';
import { Role } from '../../entities/usr/role.entity';

@ValidatorConstraint({ name: 'name', async: true })
@Injectable()
export class IsRoleNameUnique implements ValidatorConstraintInterface {
	constructor(
		@InjectRepository(Role)
		private roleRepository: Repository<Role>
	) { }

	async validate(name: string, args: ValidationArguments) {
		const uperCaseName = name.toUpperCase().trim();
		return await this.roleRepository.findOne({ where: { name: uperCaseName } }).then(role => {
			if (role) {
				return false;
			};
			return true;
		});
	}
}

export function UniqueRoleName(validationOptions?: ValidationOptions) {
	return function(object: object, propertyName: string) {
		registerDecorator({
			target: object.constructor,
			propertyName: propertyName,
			options: validationOptions,
			//constraints: [],
			validator: IsRoleNameUnique,
		});
	};
}