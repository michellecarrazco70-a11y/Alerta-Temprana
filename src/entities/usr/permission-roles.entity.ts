import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm"
import { Permission } from './permission.entity';
import { Role } from './role.entity';

//Entities
@Entity({ name: 'permission_roles', schema: 'usr' })
export class PermissionRole {

	@PrimaryGeneratedColumn('identity', { generatedIdentity: 'ALWAYS' })
	id: number

	@Column({ name: 'role_id'})
	roleId: number;

	@Column({ name: 'permission_id'})
	permissionId: number;

	@CreateDateColumn({
		name: 'created_at',
		type: 'timestamp',
		default: () => 'CURRENT_TIMESTAMP',
	})
	createdAt: Date;

	@ManyToOne(() => Role, (role) => role.permissionRoles)
	@JoinColumn({ name: 'role_id' })
	role: Role;

	@ManyToOne(() => Permission, (permission) => permission.permissionRoles)
	@JoinColumn({ name: 'permission_id' })
	permission: Permission;
}