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

import { AdrTema } from './adr-tema.entity';
import { AdrVoceria } from './adr-voceria.entity';
import { AdrMedio } from './adr-medio.entity';

export const VIAS_ENTREVISTA = ['presencial', 'telefonica'] as const;
export type ViaEntrevista = typeof VIAS_ENTREVISTA[number];

@Entity({ name: 'adr_entrevistas', schema: 'usr' })
export class AdrEntrevista {

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

  @Column({ name: 'tema_id', type: 'integer' })
  temaId: number;

  @Column({ name: 'voceria_id', type: 'integer' })
  voceriaId: number;

  @Column({ name: 'medio_id', type: 'integer' })
  medioId: number;

  @Column({ type: 'date' })
  fecha: string;

  @Column({ type: 'time' })
  hora: string;

  @Column({ type: 'varchar', length: 20 })
  via: ViaEntrevista;

  @Column({ name: 'created_by', type: 'integer' })
  createdBy: number;

  @Column({ name: 'updated_by', type: 'integer', nullable: true })
  updatedBy: number | null;

  @Column({ name: 'deleted_by', type: 'integer', nullable: true })
  deletedBy: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => AdrTema, { nullable: false })
  @JoinColumn({ name: 'tema_id' })
  tema: AdrTema;

  @ManyToOne(() => AdrVoceria, { nullable: false })
  @JoinColumn({ name: 'voceria_id' })
  voceria: AdrVoceria;

  @ManyToOne(() => AdrMedio, { nullable: false })
  @JoinColumn({ name: 'medio_id' })
  medio: AdrMedio;

  constructor(partial: Partial<AdrEntrevista> = {}) {
    Object.assign(this, partial);
  }
}