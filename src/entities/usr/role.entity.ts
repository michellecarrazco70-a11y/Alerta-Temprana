import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	OneToMany,
	BeforeInsert,
	BeforeUpdate,
	DeleteDateColumn,
} from 'typeorm';
import { RoleUser } from './role-user.entity';
import { PermissionRole } from './permission-roles.entity';

@Entity({ name: 'roles', schema: 'usr' })
export class Role {
	@PrimaryGeneratedColumn('identity', { generatedIdentity: 'ALWAYS' })
	id: number;

	@Column({ type: 'varchar', nullable: true })
	name: string;

	@Column({ type: 'varchar', nullable: true })
	route: string;

	@Column({name: 'desc', type: 'varchar'})
	desc: string;

	@Column({ name: 'active', default: true })
	isActive: boolean;

	@Column({ type: 'integer', nullable: true })
	order: number;

	@Column({ name: 'created_by', type: 'integer', nullable: true })
	createdBy: number;

	@CreateDateColumn({
		name: 'created_at',
		type: 'timestamp',
		default: () => 'CURRENT_TIMESTAMP',
	})
	createdAt: Date;

	@UpdateDateColumn({
		name: 'updated_at',
		type: 'timestamp',
		default: () => 'CURRENT_TIMESTAMP',
	})
	updatedAt: Date;

	@DeleteDateColumn({
		name: 'deleted_at',
		type: 'timestamp',
		nullable: true,
		default: null,
	})
	deletedAt: Date;

	//Relations
	@OneToMany(() => RoleUser, (roleUser) => roleUser.role)
	public roleUsers: RoleUser[];

	@OneToMany(() => PermissionRole, (permissionRole) => permissionRole.role)
	public permissionRoles: PermissionRole[];

	// Functions
	@BeforeInsert()
	checkFieldsBeforeInsert() {
		this.name = this.name.toUpperCase().trim();
	}

	@BeforeUpdate()
	checkFieldsBeforeUpdate() {
		this.checkFieldsBeforeInsert();
	}
	
	constructor(partial: Partial<Role> = {}) {
		Object.assign(this, partial);
	}
}
