import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type TypeToken = 'reset-password'

@Entity({ name: 'user_tokens', schema: 'usr' })
export class UserTokens {
	@PrimaryGeneratedColumn('identity', { generatedIdentity: 'ALWAYS' })
	id: number;

	@Column({ name: 'user_id', type: 'integer' })
	userId: number;

	@Column({ name: 'type_token', type: 'varchar', length: 50 })
	typeToken: TypeToken;

	@Column({ type: 'varchar', length: 70 })
	token: string;

	@CreateDateColumn({
		name: 'created_at',
		type: 'timestamp',
		default: () => 'CURRENT_TIMESTAMP',
	})
	createdAt: Date;

	@Column({
		name: 'expire_on',
		type: 'timestamp'
	})
	expireOn: Date;

	constructor(data: Partial<UserTokens> = {}) {
		Object.assign(this, data)
	}
}