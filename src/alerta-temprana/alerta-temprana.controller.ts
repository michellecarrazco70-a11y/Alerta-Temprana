import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	ParseUUIDPipe,
	Patch,
	Post,
	Query
} from '@nestjs/common';

import { GetCurrentUserId } from '../common/decorators/commons.decorator';

import { AlertaTempranaService } from './alerta-temprana.service';
import { CreateAlertaTempranaDto } from './dtos/create-alerta-temprana.dto';
import { UpdateAlertaTempranaDto } from './dtos/update-alerta-temprana.dto';
import { FindAlertasTempranasDto } from './dtos/find-alerta-temprana.dto';
@Controller('alertas-tempranas')
export class AlertaTempranaController {

	constructor(
		private readonly alertasService: AlertaTempranaService
	) { }

	@Post()
	create(
		@Body() dto: CreateAlertaTempranaDto,
		@GetCurrentUserId() userId: number
	) {
		return this.alertasService.create(dto, userId);
	}

	@Get()
	findAll(@Query() filters: FindAlertasTempranasDto) {
		return this.alertasService.findAll(filters);
	}

	@Get(':uuid')
	findOne(@Param('uuid', ParseUUIDPipe) uuid: string) {
		return this.alertasService.findOne(uuid);
	}

	@Patch(':uuid/editar')
	update(
		@Param('uuid', ParseUUIDPipe) uuid: string,
		@Body() dto: UpdateAlertaTempranaDto,
		@GetCurrentUserId() userId: number
	) {
		return this.alertasService.update(uuid, dto, userId);
	}

	@Delete(':uuid/eliminar')
	@HttpCode(HttpStatus.NO_CONTENT)
	remove(
		@Param('uuid', ParseUUIDPipe) uuid: string,
		@GetCurrentUserId() userId: number
	): Promise<void> {
		return this.alertasService.remove(uuid, userId);
	}
}