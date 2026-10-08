import { InjectRepository } from '@nestjs/typeorm';
import {
	registerDecorator,
	ValidationArguments,
	ValidationOptions,
	ValidatorConstraint,
	ValidatorConstraintInterface,
} from 'class-validator';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';

//Entities
import { Group } from '../../entities/usr/group.entity';

@ValidatorConstraint({ name: 'name', async: true })
@Injectable()
export class IsGroupNameUnique implements ValidatorConstraintInterface {
	constructor(
		@InjectRepository(Group)
		private groupRepository: Repository<Group>
	) { }

	async validate(name: string, args: ValidationArguments) {
		const uperCaseName = name.toUpperCase().trim();
		return await this.groupRepository.findOne({ where: { name: uperCaseName } }).then(group => {
			if (group) {
				return false;
			};
			return true;
		});
	}
}

export function UniqueGroupName(validationOptions?: ValidationOptions) {
	return function(object: object, propertyName: string) {
		registerDecorator({
			target: object.constructor,
			propertyName: propertyName,
			options: validationOptions,
			//constraints: [],
			validator: IsGroupNameUnique,
		});
	};
}