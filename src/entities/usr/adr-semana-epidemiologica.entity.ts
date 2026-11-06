import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany
} from 'typeorm';

import { InformeEpidemiologico } from './adr-informe-epidemiologico.entity';

@Entity({ name: 'adr_semanas_epidemiologicas', schema: 'usr' })
export class SemanaEpidemiologica {

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

  @Column({ name: 'numero_semana', type: 'smallint' })
  numeroSemana: number;

  @Column({ name: 'fecha_inicio', type: 'date' })
  fechaInicio: string;

  @Column({ name: 'fecha_fin', type: 'date' })
  fechaFin: string;

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

  @OneToMany(() => InformeEpidemiologico, informe => informe.semana)
  informes:  InformeEpidemiologico[];
}