import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    Generated,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity({ schema: 'usr', name: 'adr_alertas_tempranas' })
export class AlertaTemprana {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'uuid', unique: true })
    @Generated('uuid')
    uuid: string;

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

    @Column({ name: 'created_by', type: 'integer' })
    createdBy: number;

    @Column({ name: 'updated_by', type: 'integer', nullable: true })
    updatedBy: number;

    @Column({ name: 'deleted_by', type: 'integer', nullable: true })
    deletedBy: number;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt: Date;

    @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
    deletedAt: Date;
}
