import { Module } from '@nestjs/common';
import { AccesosPublicosController } from './accesos-publicos.controller';
import { AccesosPublicosService } from './accesos-publicos.service';
import { Features } from 'src/entities/usr/red_troncal_features.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Features])],
  controllers: [AccesosPublicosController],
  providers: [AccesosPublicosService]
})
export class AccesosPublicosModule {}
