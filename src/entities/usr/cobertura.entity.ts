// cobertura.entity.ts
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'coberturas', schema: 'usr' })
export class Cobertura {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ type: 'text' })
  group_label!: 'PROYECTADA' | 'REAL';

  @Column({ type: 'text' })
  rttu_id!: string;

  @Column({ type: 'jsonb' })
  boundbox!: { north: number; south: number; east: number; west: number };

  @Column({ type: 'bytea' })
  png!: Buffer;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  created_at!: Date;

  @Column({ type: 'boolean', default: true })
  activo!: boolean;
}
