import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, ValidationArguments } from 'class-validator';


export const appIsRequired = () => IsNotEmpty({ message: (a: ValidationArguments) => `El campo ${a.property} es obligatorio` });

export const appIsEmail = () => IsEmail({}, { message: (a: ValidationArguments) => `El campo ${a.property} debe ser un correo electronico valido` });

export function Trim(): PropertyDecorator {
	return Transform(({ value }) => value.trim());
}

export const appIsNotEmpty = () => {
	return applyDecorators(
		Trim(),
		IsNotEmpty({ message: (a: ValidationArguments) => `El campo ${a.property} no puede estar vacio` })
	);
}


