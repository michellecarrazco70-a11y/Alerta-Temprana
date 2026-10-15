import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RiesgoMediatico } from '../entities/usr/riesgo-mediatico.entity';
import { AdrMedia } from '../entities/usr/adr-media.entity';

import { RiesgoMediaticoController } from './riesgo-mediatico.controller';
import { RiesgoMediaticoService } from './riesgo-mediatico.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RiesgoMediatico,
      AdrMedia
    ])
  ],
  controllers: [RiesgoMediaticoController],
  providers: [RiesgoMediaticoService],
  exports: [RiesgoMediaticoService]
})
export class RiesgoMediaticoModule {}