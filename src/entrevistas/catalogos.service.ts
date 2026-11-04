import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AdrTema } from '../entities/usr/adr-tema.entity';
import { AdrVoceria } from '../entities/usr/adr-voceria.entity';
import { AdrMedio } from '../entities/usr/adr-medio.entity';

export enum TipoCatalogo {
  TEMAS = 'temas',
  VOCERIAS = 'vocerias',
  MEDIOS = 'medios'
}

// Las tres entidades tienen la misma forma, por eso un solo tipo sirve.
type RepoCatalogo = Repository<AdrTema>;

@Injectable()
export class CatalogosService {

  private readonly repos: Record<TipoCatalogo, RepoCatalogo>;

  constructor(
    @InjectRepository(AdrTema) temas: Repository<AdrTema>,
    @InjectRepository(AdrVoceria) vocerias: Repository<AdrVoceria>,
    @InjectRepository(AdrMedio) medios: Repository<AdrMedio>
  ) {
    this.repos = {
      [TipoCatalogo.TEMAS]: temas,
      [TipoCatalogo.VOCERIAS]: vocerias,
      [TipoCatalogo.MEDIOS]: medios
    };
  }

  private getRepo(tipo: TipoCatalogo): RepoCatalogo {
    const repo = this.repos[tipo];
    if (!repo) throw new NotFoundException('Catálogo no encontrado.');
    return repo;
  }

  private buscarPorNombre(repo: RepoCatalogo, nombre: string) {
    return repo
      .createQueryBuilder('c')
      .where('lower(btrim(c.nombre)) = lower(btrim(:nombre))', { nombre })
      .getOne();
  }

  async findAll(tipo: TipoCatalogo) {
    const items = await this.getRepo(tipo).find({
      select: { uuid: true, nombre: true },
      order: { nombre: 'ASC' }
    });
    return items;
  }

  // Si el nombre ya existe, devuelve el existente en lugar de fallar.
  async createOrGet(tipo: TipoCatalogo, nombre: string, userId: number) {
    const repo = this.getRepo(tipo);

    const existente = await this.buscarPorNombre(repo, nombre);
    if (existente) return { uuid: existente.uuid, nombre: existente.nombre };

    try {
      const creado = await repo.save(repo.create({ nombre, createdBy: userId }));
      return { uuid: creado.uuid, nombre: creado.nombre };
    } catch (error: any) {
      // 23505 = violación del índice único (otra petición lo creó al mismo tiempo)
      if (error?.code === '23505') {
        const ganador = await this.buscarPorNombre(repo, nombre);
        if (ganador) return { uuid: ganador.uuid, nombre: ganador.nombre };
      }
      throw error;
    }
  }
}