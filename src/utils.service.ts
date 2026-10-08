import { ClassConstructor, plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { ERRORS } from './common/constants/errors.const';
import { DTOValidationException } from './common/exceptions/dto-validation.exception';
import axios from 'axios';

export class UtilsService {
	static isNoE(data: any) {
		return data === null || typeof data === 'undefined' ||
			(typeof data === 'string' && data === '') ||
			(Array.isArray(data) && data.length === 0) ||
			(typeof data === 'object' && Object.keys(data).length === 0)
	}
	static matchArrays<T>(array1: T[], array2: T[]) {
		array1 = array1 || []
		array2 = array2 || []
		return array1.filter(element => array2.includes(element));
	}
	static async validatorDto<T extends ClassConstructor<any>>(
		dto: T,
		obj: Object
	) {
		const objInstance = plainToClass(dto, obj);
		const errors = await validate(objInstance);
		if (errors.length > 0) {
			throw new DTOValidationException(ERRORS.ERR0P04, errors)
		}
	}
	static generateRandomString(length: number, type: 'alphabetic' | 'alphanumeric' | 'numeric' | 'password' = 'alphanumeric') {
		let result = '';
		let characters = ''
		switch (type) {
			case 'alphabetic':
				characters = 'abcdefghijklmnopqrstuvwxyz';
				break;
			case 'alphanumeric':
				characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
				break;
			case 'numeric':
				characters = '0123456789';
				break;
			case 'password':
				characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz012345678901234567890123456789=?¡¿!@#$%&*()-_';
				break;
		}
		const charactersLength = characters.length;
		let counter = 0;
		while (counter < length) {
			result += characters.charAt(Math.floor(Math.random() * charactersLength));
			counter += 1;
		}
		return result;
	}
	static hideEmailAddress(s: string) {
		var i = s.indexOf('@');
		var startIndex = i * .2 | 0;
		var endIndex = i * .9 | 0;
		return s.slice(0, startIndex) +
			s.slice(startIndex, endIndex).replace(/./g, '*') +
			s.slice(endIndex);
	}
	static async validateRecaptcha(token) {
		const r = await axios.post(`https://www.google.com/recaptcha/api/siteverify`, null, {
			params: {
				secret: process.env.GOOGLE_RECAPTCHA_SECRET,
				response: token
			}
		})
		if (!r || !r.data || !r.data.success) {
			return false
		}
		return true
	}
	static assignExistingProperties(target: any, source: any) {
		Object.keys(target).forEach(key => {
			if (source.hasOwnProperty(key)) {
				target[key] = source[key];
			}
		});
	}
}