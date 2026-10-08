import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { LOG_ACTIONS } from '../../common/enums/log-movements.enum';

@Entity({ name: 'logs', schema: 'sys' })
export class Log {
	@PrimaryGeneratedColumn('identity', { generatedIdentity: 'ALWAYS' })
	id: number;

	@Column({ type: 'varchar', nullable: true })
	message: string;

	@Column({ type: 'varchar', nullable: true })
	context: string;

	@Column({ type: 'varchar', nullable: true })
	action: any;

	@Column({ name: 'user_id', type: 'integer', nullable: true })
	userId: number;

	@Column({ type: 'jsonb', nullable: true })
	data: any;

	@Column({ type: 'varchar', nullable: true })
	stack: string;

	@CreateDateColumn({
		name: 'created_at',
		type: 'timestamp',
		default: () => 'CURRENT_TIMESTAMP',
	})
	createdAt: Date;
	// constructor(asd: Partial<Log>){

	// }
}