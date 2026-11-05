import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Not, Repository } from 'typeorm';

import { AdrEntrevista } from '../entities/usr/adr-entrevista.entity';
import { AdrTema } from '../entities/usr/adr-tema.entity';
import { AdrVoceria } from '../entities/usr/adr-voceria.entity';
import { AdrMedio } from '../entities/usr/adr-medio.entity';

import { CreateEntrevistaDto } from './dtos/create-entrevista.dto';
import { UpdateEntrevistaDto } from './dtos/update-entrevista.dto';
import { FindEntrevistasDto } from './dtos/find-entrevistas.dto';

type RepoCatalogo = Repository<AdrTema>;

@Injectable()
export class EntrevistasService {

  constructor(
    @InjectRepository(AdrEntrevista)
    private readonly entrevistaRepo: Repository<AdrEntrevista>,
    @InjectRepository(AdrTema) private readonly temaRepo: Repository<AdrTema>,
    @InjectRepository(AdrVoceria) private readonly voceriaRepo: Repository<AdrVoceria>,
    @InjectRepository(AdrMedio) private readonly medioRepo: Repository<AdrMedio>,
    private readonly dataSource: DataSource
  ) {}

  // ---------- Utilidades ----------

  // "10:00:00" -> "10:00"
  private hhmm(hora: string): string {
    return hora.slice(0, 5);
  }

  // Valida que fecha+hora no sean anteriores a "ahora" en Sonora (UTC-7, sin horario de verano).
  private validarNoPasada(fecha: string, hora: string) {
    // 'sv-SE' produce "YYYY-MM-DD HH:mm:ss", comparable como texto.
    const ahora = new Date()
      .toLocaleString('sv-SE', { timeZone: 'America/Hermosillo' })
      .slice(0, 16);

    if (`${fecha} ${hora}` < ahora) {
      throw new BadRequestException(
        'No se puede programar una entrevista en una fecha y hora pasadas.'
      );
    }
  }

  private async resolverCatalogo(
    repo: RepoCatalogo,
    uuid: string,
    etiqueta: string
  ): Promise<{ id: number }> {
    const item = await repo.findOne({ where: { uuid }, select: { id: true } });
    if (!item) throw new BadRequestException(`${etiqueta} no encontrado.`);
    return item;
  }

  private async validarEmpalme(
    voceriaId: number,
    fecha: string,
    hora: string,
    excluirId?: number
  ) {
    const existe = await this.entrevistaRepo.exist({
      where: {
        voceriaId,
        fecha,
        hora,
        ...(excluirId ? { id: Not(excluirId) } : {})
      }
    });

    if (existe) {
      throw new ConflictException(
        'La vocería ya tiene una entrevista programada en esa fecha y hora.'
      );
    }
  }

  // 23505 = violación del índice único (dos peticiones simultáneas)
  private manejarErrorBD(error: any): never {
    if (error?.code === '23505') {
      throw new ConflictException(
        'La vocería ya tiene una entrevista programada en esa fecha y hora.'
      );
    }
    throw error;
  }

  private toResponse(e: AdrEntrevista) {
    return {
      uuid: e.uuid,
      fecha: e.fecha,
      hora: this.hhmm(e.hora),
      via: e.via,
      tema: { uuid: e.tema.uuid, nombre: e.tema.nombre },
      voceria: { uuid: e.voceria.uuid, nombre: e.voceria.nombre },
      medio: { uuid: e.medio.uuid, nombre: e.medio.nombre }
    };
  }

  // ---------- Casos de uso ----------

  async create(dto: CreateEntrevistaDto, userId: number) {
    this.validarNoPasada(dto.fecha, dto.hora);

    const tema = await this.resolverCatalogo(this.temaRepo, dto.temaUuid, 'Tema');
    const voceria = await this.resolverCatalogo(this.voceriaRepo, dto.voceriaUuid, 'Vocería');
    const medio = await this.resolverCatalogo(this.medioRepo, dto.medioUuid, 'Medio');

    await this.validarEmpalme(voceria.id, dto.fecha, dto.hora);

    try {
      const saved = await this.entrevistaRepo.save(
        this.entrevistaRepo.create({
          temaId: tema.id,
          voceriaId: voceria.id,
          medioId: medio.id,
          fecha: dto.fecha,
          hora: dto.hora,
          via: dto.via,
          createdBy: userId
        })
      );
      return this.findOne(saved.uuid);
    } catch (error) {
      this.manejarErrorBD(error);
    }
  }

  async findAll(filters: FindEntrevistasDto) {
    const skip = filters.skip ?? 0;
    const take = filters.take ?? 10;

    const query = this.entrevistaRepo
      .createQueryBuilder('e')
      .innerJoinAndSelect('e.tema', 'tema')
      .innerJoinAndSelect('e.voceria', 'voceria')
      .innerJoinAndSelect('e.medio', 'medio');

    if (filters.fecha) {
      query.andWhere('e.fecha = :fecha', { fecha: filters.fecha });
    }
    if (filters.voceriaUuid) {
      query.andWhere('voceria.uuid = :voceriaUuid', { voceriaUuid: filters.voceriaUuid });
    }
    if (filters.medioUuid) {
      query.andWhere('medio.uuid = :medioUuid', { medioUuid: filters.medioUuid });
    }

    const [rows, total] = await query
      .orderBy('e.fecha', 'ASC')
      .addOrderBy('e.hora', 'ASC')
      .addOrderBy('e.id', 'ASC')
      .skip(skip)
      .take(take)
      .getManyAndCount();

    return { total, data: rows.map((r) => this.toResponse(r)), skip, take };
  }

  async findOne(uuid: string) {
    const entrevista = await this.entrevistaRepo.findOne({
      where: { uuid },
      relations: { tema: true, voceria: true, medio: true }
    });

    if (!entrevista) throw new NotFoundException('Entrevista no encontrada.');
    return this.toResponse(entrevista);
  }

  async update(uuid: string, dto: UpdateEntrevistaDto, userId: number) {
    // Sin relaciones cargadas, para que los cambios de *_id se respeten al guardar.
    const entrevista = await this.entrevistaRepo.findOne({ where: { uuid } });
    if (!entrevista) throw new NotFoundException('Entrevista no encontrada.');

    const horaActual = this.hhmm(entrevista.hora);
    const fecha = dto.fecha ?? entrevista.fecha;
    const hora = dto.hora ?? horaActual;
    const cambioFechaHora = fecha !== entrevista.fecha || hora !== horaActual;

    // Solo se exige "no pasada" si cambian fecha u hora (se permite editar entrevistas viejas).
    if (cambioFechaHora) this.validarNoPasada(fecha, hora);

    let voceriaId = entrevista.voceriaId;
    if (dto.temaUuid) {
      entrevista.temaId = (await this.resolverCatalogo(this.temaRepo, dto.temaUuid, 'Tema')).id;
    }
    if (dto.voceriaUuid) {
      voceriaId = (await this.resolverCatalogo(this.voceriaRepo, dto.voceriaUuid, 'Vocería')).id;
    }
    if (dto.medioUuid) {
      entrevista.medioId = (await this.resolverCatalogo(this.medioRepo, dto.medioUuid, 'Medio')).id;
    }

    if (cambioFechaHora || voceriaId !== entrevista.voceriaId) {
      await this.validarEmpalme(voceriaId, fecha, hora, entrevista.id);
    }

    entrevista.voceriaId = voceriaId;
    entrevista.fecha = fecha;
    entrevista.hora = hora;
    if (dto.via) entrevista.via = dto.via;
    entrevista.updatedBy = userId;

    try {
      await this.entrevistaRepo.save(entrevista);
    } catch (error) {
      this.manejarErrorBD(error);
    }

    return this.findOne(uuid);
  }

  async remove(uuid: string, userId: number): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const entrevista = await manager.findOne(AdrEntrevista, { where: { uuid } });
      if (!entrevista) throw new NotFoundException('Entrevista no encontrada.');

      await manager.update(AdrEntrevista, { id: entrevista.id }, { deletedBy: userId });
      await manager.softDelete(AdrEntrevista, { id: entrevista.id });
    });
  }
}