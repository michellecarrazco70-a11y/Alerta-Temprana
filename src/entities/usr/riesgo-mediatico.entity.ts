import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany
} from 'typeorm';

import { AdrMedia } from './adr-media.entity';

export type TipoRiesgo = 'mediatico' | 'noticia';

export type EstatusRiesgo =
  | 'validada'
  | 'en_proceso_validacion';

export type ClasificacionRiesgo =
  | 'confirmada'
  | 'falsa';

export type NivelRiesgo =
  | 'alto'
  | 'medio'
  | 'bajo';

@Entity({ name: 'adr_riesgos_mediaticos', schema: 'usr' })
export class RiesgoMediatico {

  @PrimaryGeneratedColumn('identity', {
    generatedIdentity: 'ALWAYS'
  })
  id: number;

  @Column({
    type: 'uuid',
    default: () => 'gen_random_uuid()',
    unique: true
  })
  uuid: string;

  @Column({ type: 'varchar', length: 20 })
  tipo: TipoRiesgo;

  @Column({ type: 'varchar', length: 500 })
  titulo: string;

  @Column({ type: 'varchar', length: 191 })
  fuente: string;

  @Column({ type: 'date' })
  fecha: string;

  @Column({ type: 'varchar', length: 2048 })
  link: string;

  @Column({
    type: 'varchar',
    length: 40,
    nullable: true
  })
  estatus: EstatusRiesgo | null;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true
  })
  clasificacion: ClasificacionRiesgo | null;

  @Column({
    name: 'nivel_riesgo',
    type: 'varchar',
    length: 20,
    nullable: true
  })
  nivelRiesgo: NivelRiesgo | null;

  @Column({
    type: 'boolean',
    default: false
  })
  tendencia: boolean;

  @Column({
    type: 'text',
    nullable: true
  })
  descripcion: string | null;

  @Column({ name: 'created_by', type: 'integer' })
  createdBy: number;

  @Column({
    name: 'updated_by',
    type: 'integer',
    nullable: true
  })
  updatedBy: number | null;

  @Column({
    name: 'deleted_by',
    type: 'integer',
    nullable: true
  })
  deletedBy: number | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp'
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp'
  })
  updatedAt: Date;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamp',
    nullable: true
  })
  deletedAt: Date | null;

  @OneToMany(() => AdrMedia, media => media.riesgo)
  archivos: AdrMedia[];

  constructor(partial: Partial<RiesgoMediatico> = {}) {
    Object.assign(this, partial);
  }
}