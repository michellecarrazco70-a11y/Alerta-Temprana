import { HttpException, HttpStatus } from '@nestjs/common';

export type ErrorCodeType = 'public-register-already-exists' | 'public-register-not-found' | 'state-token-expired'

export class CodeException extends HttpException {
	error_code: ErrorCodeType
	constructor(msg: string, errorCode: ErrorCodeType, httpCode: HttpStatus) {
		super(msg, httpCode);
		this.error_code = errorCode
	}
}