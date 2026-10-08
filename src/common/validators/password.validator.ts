import { ValidationArguments, isStrongPassword, maxLength, registerDecorator } from 'class-validator';

export const appPassword = (isRequired = true) => {
	return (object: Record<string, any>, propertyName: string) => {
		registerDecorator({
			name: 'appPassword',
			target: object.constructor,
			propertyName: propertyName,
			validator: {
				validate(value: any, args: ValidationArguments) {
					if (!isRequired && !value) {
						return true
					}
					return isStrongPassword(value, {
						minLength: 8,
						minSymbols: 1,
						minUppercase: 1,
						minLowercase: 1,
						minNumbers: 1
					}) && maxLength(value, 18);
				},
				defaultMessage(args: ValidationArguments) {
					return 'La contraseña debe ser enmtre 8 y 18 caracteres, al menos un carácter especial, una letra mayúscula, una letra minúscula y un número';
				}
			}
		});
	};
};