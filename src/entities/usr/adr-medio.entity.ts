import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn
} from 'typeorm';

@Entity({ name: 'adr_medios', schema: 'usr' })
export class AdrMedio {

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

  @Column({ type: 'varchar', length: 191 })
  nombre: string;

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

  constructor(partial: Partial<AdrMedio> = {}) {
    Object.assign(this, partial);
  }
}