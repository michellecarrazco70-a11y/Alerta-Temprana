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
import { Permission } from '../../entities/usr/permission.entity';
  
  @ValidatorConstraint({ name: 'name', async: true })
  @Injectable()
  export class IsPermissionNameUnique implements ValidatorConstraintInterface {
    constructor(
        @InjectRepository(Permission)
        private permissionRepository: Repository<Permission>
    ) {}
  
    async validate(name: string, args: ValidationArguments) {
        const uperCaseName = name.toUpperCase().trim();
      return await this.permissionRepository.findOne({ where: { name: uperCaseName }}).then(permission => {
        if (permission) {
            return false;
        };
        return true;
      });
    }
  }
  
  export function UniquePermissionName(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string) {
      registerDecorator({
        target: object.constructor,
        propertyName: propertyName,
        options: validationOptions,
        //constraints: [],
        validator: IsPermissionNameUnique,
      });
    };
  }