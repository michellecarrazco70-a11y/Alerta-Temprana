import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AlertaTemprana } from '../entities/usr/alerta-temprana.entity';

import { AlertaTempranaController } from './alerta-temprana.controller';
import { AlertaTempranaService } from './alerta-temprana.service';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			AlertaTemprana
		])
	],
	controllers: [AlertaTempranaController],
	providers: [AlertaTempranaService],
	exports: [AlertaTempranaService]
})
export class AlertaTempranaModule { }