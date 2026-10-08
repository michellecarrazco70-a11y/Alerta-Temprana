import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity({name: 'features', schema: 'usr'})
export class FeaturesJson{
    @PrimaryGeneratedColumn()
    id: number

    @Column({name: 'geojson', type: 'jsonb'})
    geojson: any
}