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

import { RiesgoMediatico } from './riesgo-mediatico.entity';

@Entity({ name: 'adr_media', schema: 'usr' })
export class AdrMedia {

  @PrimaryGeneratedColumn('identity', {
    generatedIdentity: 'ALWAYS'
  })
  id: number;

  @Column({ name: 'riesgo_id', type: 'integer' })
  riesgoId: number;

  @ManyToOne(
    () => RiesgoMediatico,
    riesgo => riesgo.archivos,
    { onDelete: 'RESTRICT' }
  )
  @JoinColumn({ name: 'riesgo_id' })
  riesgo: RiesgoMediatico;

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

  // Excluido de consultas normales para no cargar archivos.
  @Column({ type: 'bytea', select: false })
  archivo: Buffer;

  @Column({ name: 'uploaded_by', type: 'integer' })
  uploadedBy: number;

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