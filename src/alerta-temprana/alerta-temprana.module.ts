import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AlertaTemprana } from '../entities/usr/alerta-temprana.entity';
import { AlertaTempranaEliminada } from '../entities/usr/alerta-temprana-eliminada.entity';

import { AlertaTempranaController } from './alerta-temprana.controller';
import { AlertaTempranaService } from './alerta-temprana.service';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			AlertaTemprana,
			AlertaTempranaEliminada
		])
	],
	controllers: [AlertaTempranaController],
	providers: [AlertaTempranaService],
	exports: [AlertaTempranaService]
})
export class AlertaTempranaModule { }