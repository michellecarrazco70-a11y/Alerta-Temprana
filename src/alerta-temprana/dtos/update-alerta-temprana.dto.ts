import { PartialType } from '@nestjs/mapped-types';
import { CreateAlertaTempranaDto } from './create-alerta-temprana.dto';

export class UpdateAlertaTempranaDto
	extends PartialType(CreateAlertaTempranaDto) { }