import {
	Column,
	CreateDateColumn,
	Entity,
	PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ schema: 'usr', name: 'adr_alertas_tempranas_eliminadas' })
export class AlertaTempranaEliminada {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ name: 'uuid_original', type: 'uuid' })
	uuidOriginal: string;

	@Column({ type: 'varchar', length: 191 })
	patologia: string;

	@Column({ type: 'date' })
	fecha: string;

	@Column({ type: 'varchar', length: 150 })
	municipio: string;

	@Column({ type: 'varchar', length: 191, nullable: true })
	localidad: string | null;

	@Column({ name: 'numero_casos', type: 'integer' })
	numeroCasos: number;

	@Column({ name: 'created_by_original', type: 'integer', nullable: true })
	createdByOriginal: number;

	@Column({ name: 'created_at', type: 'timestamp', nullable: true })
	createdAt: Date;

	@Column({ name: 'deleted_by', type: 'integer', nullable: true })
	deletedBy: number;

	@CreateDateColumn({ name: 'deleted_at', type: 'timestamp' })
	deletedAt: Date;
}