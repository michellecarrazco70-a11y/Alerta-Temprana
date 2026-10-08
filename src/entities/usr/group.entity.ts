import {
	Column,
	CreateDateColumn,
	Entity,
	OneToMany,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm';

//Entities
import { DeleteDateColumn, BeforeInsert, BeforeUpdate } from 'typeorm';
import { Permission } from './permission.entity';

@Entity({ name: 'groups', schema: 'usr' })
export class Group {
	@PrimaryGeneratedColumn('identity', { generatedIdentity: 'ALWAYS' })
	id: number;

	@Column({ type: 'varchar', unique: true })
	name: string;

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
	@OneToMany(() => Permission, (permission) => permission.group)
	permissions: Permission[];

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
