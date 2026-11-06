import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';

import { SemanaEpidemiologica } from './adr-semana-epidemiologica.entity';

@Entity({ name: 'adr_informes_epidemiologicos', schema: 'usr' })
export class InformeEpidemiologico {

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

  @Column({ name: 'semana_id', type: 'integer' })
  semanaId: number;

  @ManyToOne(
    () => SemanaEpidemiologica,
    semana => semana.informes,
    { onDelete: 'RESTRICT' }
  )
  @JoinColumn({ name: 'semana_id' })
  semana: SemanaEpidemiologica;

  @Column({ type: 'varchar', length: 100 })
  patologia: string;

  @Column({
    name: 'nombre_archivo',
    type: 'varchar',
    length: 255
  })
  nombreArchivo: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true
  })
  extension: string | null;

  @Column({
    name: 'mime_type',
    type: 'varchar',
    length: 150
  })
  mimeType: string;

  @Column({ name: 'size_bytes', type: 'integer' })
  sizeBytes: number;

  // Excluido de consultas normales para no cargar los archivos.
  @Column({ type: 'bytea', select: false })
  archivo: Buffer;

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
}