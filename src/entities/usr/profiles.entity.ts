import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { ProfileLayerPermission } from './profile-layer-permissions.entity';
import { UserProfileRedTroncal } from './user-profile-red-troncal.entity'; 

@Entity({ name: 'profiles', schema: 'usr' })
export class Profile {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'text', unique: true })
  code!: string; // e.g. 'ADMIN', 'TR'

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @OneToMany(() => ProfileLayerPermission, (p) => p.profile)
  layerPermissions!: ProfileLayerPermission[];

  @OneToMany(() => UserProfileRedTroncal, (up) => up.profile)
  userAssignments!: UserProfileRedTroncal[];
}
