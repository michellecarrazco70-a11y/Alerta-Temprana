import {
	Column,
	CreateDateColumn,
	DeleteDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm';
import { Role } from './role.entity';

//Entities
import { User } from './user.entity';

@Entity({ name: 'role_users', schema: 'usr' })
export class RoleUser {
	@PrimaryGeneratedColumn('identity', { generatedIdentity: 'ALWAYS' })
	id: number;

	@Column({ name: 'role_id' })
	roleId: number;

	@Column({ name: 'user_id' })
	userId: number;

	@ManyToOne(() => Role, (role) => role.roleUsers)
	@JoinColumn({ name: 'role_id' })
	role: Role;

	@ManyToOne(() => User, (user) => user.roleUsers)
	@JoinColumn({ name: 'user_id' })
	user: User;

	@CreateDateColumn({
		name: 'created_at',
		type: 'timestamp',
		default: () => 'CURRENT_TIMESTAMP',
	})
	createdAt: Date;

	constructor(partial: Partial<RoleUser> = {}) {
		Object.assign(this, partial);
	}
}
