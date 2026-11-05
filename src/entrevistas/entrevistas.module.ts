import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AdrEntrevista } from '../entities/usr/adr-entrevista.entity';
import { AdrTema } from '../entities/usr/adr-tema.entity';
import { AdrVoceria } from '../entities/usr/adr-voceria.entity';
import { AdrMedio } from '../entities/usr/adr-medio.entity';

import { CatalogosController } from './catalogos.controller';
import { CatalogosService } from './catalogos.service';

import { EntrevistasController } from './entrevistas.controller';
import { EntrevistasService } from './entrevistas.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdrEntrevista, AdrTema, AdrVoceria, AdrMedio])
  ],
  controllers: [CatalogosController, EntrevistasController],
  providers: [CatalogosService, EntrevistasService],
  exports: [CatalogosService]
})
export class EntrevistasModule {}