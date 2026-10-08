import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { ProfileLayerPermission } from './profile-layer-permissions.entity'; 

@Entity({ name: 'layers', schema: 'usr' })
export class Layer {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id!: string; // bigint comes back as string in JS drivers sometimes

  @Index({ unique: true })
  @Column({ type: 'text', unique: true })
  key!: string; // e.g. 'Salud', 'escuelas'

  @Column({ type: 'text' })
  label!: string;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @OneToMany(() => ProfileLayerPermission, (p) => p.layer)
  profilePermissions!: ProfileLayerPermission[];
}
