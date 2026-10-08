import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from "typeorm";

@Entity({name: "municipio_historial", schema: "usr"})
export class MunicipioImage {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    municipio_name: string;

    @Column({ type: "bytea" }) // Store binary image data
    img_data: Buffer;

    @CreateDateColumn()
    created_at: Date;

    @Column({ default: true })
    activo: boolean;

    @Column({name: 'bbox', type: 'jsonb'})
    bbox: any

    @Column({ nullable: true })
    deleted_at: Date;
}
