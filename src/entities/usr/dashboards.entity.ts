import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity({name: 'dashboards', schema: 'usr'})
export class Dashboard{
    @PrimaryGeneratedColumn()
    pk: number;

    @Column({type: 'varchar', nullable: false})
    nombre: string;

    @Column({type: 'varchar', nullable: false})
    dependencia: string;

    @Column({type: 'varchar', nullable: false})
    area: string;

    @Column({type: 'varchar', nullable: false})
    unidad_responsable: string;

    @Column({type: 'varchar', nullable: true})
    descripcion: string;

    @Column({type: 'varchar', nullable: false})
    link_powerbi: string;

    @Column({type: 'varchar', name: 'tipo'})
    tipo: string

    @Column({name: 'is_active', default: true})
    is_active: boolean;

    @CreateDateColumn({
        name: 'created_at',
        type: 'timestamp',
        default: ()=> 'CURRENT_TIMESTAMP'
    })
    created_at: Date;

    
    @UpdateDateColumn({
        name: 'updated_at',
        type: 'timestamp',
        default: ()=> 'CURRENT_TIMESTAMP'
    })
    updated_at: Date;

    @Column({name: 'dashboard_img', type: 'bytea'})
    dashboard_img: any
}