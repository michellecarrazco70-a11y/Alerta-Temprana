import { BeforeInsert, BeforeUpdate, Column, CreateDateColumn, DeleteDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { RoleUser } from './role-user.entity';

@Entity({ name: 'users', schema: 'usr' })
export class User {
	@PrimaryGeneratedColumn('identity', { generatedIdentity: 'ALWAYS' })
	id: number;

	@Column({ name: 'uuid', type: 'uuid', default: () => 'gen_random_uuid()', unique: true })
	uuid: string;

	@Column({ type: 'varchar', length: 191 })
	name: string;

	@Column({ name: 'first_name', type: 'varchar', length: 191 })
	firstName: string;

	@Column({ name: 'second_name', type: 'varchar', length: 191, nullable: true })
	secondName: string;

	@Column({ name: 'org', type: 'varchar', length: 191, nullable: true })
	org: string;

	@Column({ name: 'puesto', type: 'varchar'})
	puesto: string;

	@Column({ type: 'varchar', length: 191, unique: true })
	email: string;

	@Column({ type: 'varchar', length: 255 })
	password: string;

	@Column({ name: 'created_by', type: 'integer', nullable: true })
	createdBy: number;

	@Column({ name: 'hashed_rt', type: 'varchar', nullable: true })
	hashedRT: string;

	@Column({ name: 'active', type: 'boolean', default: true })
	isActive: boolean;

	@Column({ type: 'integer', nullable: true })
	order: number;

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
	@OneToMany(() => RoleUser, (roleUsers) => roleUsers.user)
	roleUsers: RoleUser[];

	@BeforeInsert()
	checkFieldsBeforeInsert() {
		this.email = this.email.toLowerCase().trim();
		this.name = this.name.trim();
		this.firstName = this.firstName.trim();
		this.secondName = this.secondName && this.secondName.trim()
	}

	@BeforeUpdate()
	checkFieldsBeforeUpdate() {
		this.checkFieldsBeforeInsert();
	}

	constructor(partial: Partial<User> = {}) {
		Object.assign(this, partial);
	}
}
