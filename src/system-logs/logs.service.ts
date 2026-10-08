import { Injectable, Scope } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LOG_ACTIONS, LogActionDataType } from '../common/enums/log-movements.enum';
import { Log } from '../entities/sys/log.entity';
import { CreateLogDto } from './dto/create-log.dto';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService {
	private _context: string

	constructor(
		@InjectRepository(Log)
		private logRepository: Repository<Log>,
	) {

	}
	setContext(value: string) {
		this._context = value
	}
	getContext() {
		return this._context || 'NoContext'
	}
	error(message: string, stack?: string, createLogDto?: CreateLogDto) {
		return this.create({
			...createLogDto,
			message, stack
		})
	}
	log<T extends LOG_ACTIONS>(message?: string, userId?: number, action?: T, data?: LogActionDataType<T>, createLogDto?: CreateLogDto) {
		return this.create({
			...createLogDto,
			message, action, data, userId
		})
	}
	async create(createLogDto: CreateLogDto): Promise<void> {
		try {

			const log = this.logRepository.create({
				...createLogDto,
				data: JSON.stringify(createLogDto.data),
				context: this.getContext(),
			});
			this.logRepository.save(log);
		} catch (error) {
			console.error(error);
		}
	}
}
