import {
  Entity,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
  Index,
} from 'typeorm';
import { Profile } from './profiles.entity';
import { Layer } from './layers.entity';

@Entity({ name: 'profile_layer_permissions', schema: 'usr' })
@Index(['profile_id', 'layer_id'], { unique: true })
export class ProfileLayerPermission {
  @PrimaryColumn({ type: 'bigint' })
  profile_id!: string;

  @PrimaryColumn({ type: 'bigint' })
  layer_id!: string;

  @Column({ type: 'boolean', default: false })
  can_read!: boolean;

  @Column({ type: 'boolean', default: false })
  can_write!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @ManyToOne(() => Profile, (p) => p.layerPermissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'profile_id' })
  profile!: Profile;

  @ManyToOne(() => Layer, (l) => l.profilePermissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'layer_id' })
  layer!: Layer;
}
