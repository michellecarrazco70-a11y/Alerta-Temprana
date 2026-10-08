import {
  Entity,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
  Index,
} from 'typeorm';
import { Profile } from './profiles.entity';
import { User } from './user.entity';

@Entity({ name: 'user_profiles_red_troncal', schema: 'usr' })
@Index(['user_id', 'profile_id'], { unique: true })
export class UserProfileRedTroncal {
  @PrimaryColumn({ type: 'bigint' })
  user_id!: string;

  @PrimaryColumn({ type: 'bigint' })
  profile_id!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Profile, (p) => p.userAssignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'profile_id' })
  profile!: Profile;
}
