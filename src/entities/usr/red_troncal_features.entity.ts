import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity({name: 'red_troncal_features', schema: 'usr'})
export class Features{
    @PrimaryGeneratedColumn()
    id: number;

    @Column({name: 'lat', type: 'float8'})
    lat: number;

    @Column({name: 'long', type: 'float8'})
    long: number;

    @Column({name: 'municipio', type: 'varchar', length: 100})
    municipio: string;

    @Column({name: 'grupo', type: 'varchar', length: 100})
    grupo: string;

    @Column({name: 'properties', type: 'json'})
    properties: any;

    @Column({name: 'grupo_gubernamental', type: 'text'})
    grupo_gubernamental: string;

    @Column({name: 'created_at', type: 'timestamp'})
    created_at: Date;

    @Column({name: 'activo', type: 'boolean'})
    activo: boolean;
}