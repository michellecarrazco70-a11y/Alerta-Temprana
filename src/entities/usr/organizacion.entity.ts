import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity({name: 'organizaciones', schema: 'usr'})
export class organizaciones{
    @PrimaryGeneratedColumn()
    pk: number;

    @CreateDateColumn({
        name: 'created_at',
        type: 'timestamp',
        default: ()=>'CURRENT_TIMESTAMP'
    })
    created_at: Date;

    @Column({type: 'varchar', nullable: false})
    nombre: string;

    @Column({type: 'varchar', nullable: false})
    creado_por: string;

}