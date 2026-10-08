import { HttpException, HttpStatus, ValidationError } from '@nestjs/common';
import { ERRORS } from '../constants/errors.const';

export interface DTOValidationErrors {
	properties: {
		[type: string]: string[];
	},
	errors: string[]
}
export class DTOValidationException extends HttpException {
	properties: { [type: string]: string[]; };
	errors: string[];
	constructor(msg: string, errors: ValidationError[]) {
		msg = msg || 'Peticion incorrecta'
		super(msg, HttpStatus.BAD_REQUEST);
		const e = this.getErrors(errors)
		this.properties = e
		this.errors = Object.keys(e).map(k => e[k]).flat()
	}
	private getErrors(err: ValidationError[]) {
		return Object.assign({}, ...err.map((e) => (e.constraints && this.plainErrors(e)) || (e.children && e.children.length && this.getErrors(e.children))))
	}
	private plainErrors(prop: ValidationError) {
		return { [prop.property]: Object.keys(prop.constraints).map(k => prop.constraints[k]) }
	}
	getResponse() {
		return {
			success: false,
			status: this.getStatus(),
			message: this.message,
			properties: this.properties,
			errors: this.errors
		};
	}
}