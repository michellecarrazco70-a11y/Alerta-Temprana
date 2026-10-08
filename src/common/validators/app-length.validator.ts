import { registerDecorator, ValidationArguments } from 'class-validator';

export const appLength = (min: number, max: number, options = { required: true }) => {
	return (object: Record<string, any>, propertyName: string) => {
		registerDecorator({
			name: 'appLength',
			target: object.constructor,
			propertyName: propertyName,
			validator: {
				validate(value: any, args: ValidationArguments) {
					if (options.required && (!value || typeof value !== 'string')) {
						return false
					}
					if (value && (value.length < min || value.length > max)) {
						return false
					}
					return true
				},
				defaultMessage(args: ValidationArguments) {
					let msg = min===max && `debe ser de ${min} caracteres` || `debe estar entre ${min} y ${max} caracteres` 
					return `La propieadad ${args.property} ${msg}`;
				}
			}
		});
	};
};