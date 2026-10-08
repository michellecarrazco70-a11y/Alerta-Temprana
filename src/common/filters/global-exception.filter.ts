import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { AxiosError } from 'axios';
import { Request, Response } from 'express';
import { DTOValidationException } from '../exceptions/dto-validation.exception';
import { QueryFailedError } from 'typeorm';
import { AppSettings } from '../../app.settings';
import { LoggerService } from '../../system-logs/logs.service';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
	private readonly nestLogger = new Logger()
	constructor(private _logger: LoggerService) { }
	catch(exception: Error, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		const request = ctx.getRequest<Request>();

		return this.createErrorResponse(exception, request, response);
	}

	createErrorResponse(exception: Error, req: Request, res: Response) {
		let message: string;
		let cause = 'cause' in exception && exception.cause
		const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
		let extraData = {}
		if (exception instanceof DTOValidationException) {
			extraData = exception.getResponse()
		}
		else if (exception instanceof HttpException) {
			message = exception.message
		}
		else if (exception instanceof ThrottlerException) {
			message = 'Demasiadas solicitudes'
		}
		else if (exception instanceof AxiosError) {
			message = `Error inesperado, codigo: ${exception.code}`
		}
		else if (exception instanceof QueryFailedError && !AppSettings.production) {
			message = `QueryFailed: ${exception.message}`
		}
		else {
			message = 'Error al procesar la peticion'
		}
		const responseBody: any = {
			success: false,
			message,
			status,
			...extraData
		};
		if ('error_code' in exception) {
			responseBody.error_code = exception.error_code
		}
		if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
			this._logger.error(exception.message, exception.stack, cause && { data: { cause } })
		}
		this.nestLogger.error(exception, exception.stack)
		return res.status(status).json(responseBody)
	}
}
