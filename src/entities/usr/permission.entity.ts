import { BeforeInsert, BeforeUpdate, DeleteDateColumn } from 'typeorm';
import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	OneToMany,
	ManyToOne,
} from 'typeorm';
import { PermissionRole } from './permission-roles.entity';
import { Group } from './group.entity';

@Entity({ name: 'permissions', schema: 'usr' })
export class Permission {
	@PrimaryGeneratedColumn('identity', { generatedIdentity: 'ALWAYS' })
	id: number;

	@Column({ type: 'varchar' })
	name: string;

	@Column({ type: 'varchar', nullable: true })
	route: string;

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
	@OneToMany(
		() => PermissionRole,
		(permissionRole) => permissionRole.permission,
	)
	permissionRoles: PermissionRole[];

	@ManyToOne(() => Group, (group) => group.permissions)
	group: Group;

	// Functions
	@BeforeInsert()
	checkFieldsBeforeInsert() {
		this.name = this.name.toUpperCase().trim();
	}

	@BeforeUpdate()
	checkFieldsBeforeUpdate() {
		this.checkFieldsBeforeInsert();
	}
	
	constructor(partial: Partial<Permission> = {}) {
		Object.assign(this, partial);
	}
}
