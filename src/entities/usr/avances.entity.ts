import { BeforeInsert, BeforeUpdate, DeleteDateColumn } from 'typeorm';
import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	OneToMany,
	ManyToOne,
} from 'typeorm';
import { PermissionRole } from './permission-roles.entity';
import { Group } from './group.entity';

@Entity({ name: 'avances', schema: 'usr' })
export class Avances {
    @PrimaryGeneratedColumn()
    pk: number;

    @Column({name: 'proy_id', type: 'int4'})
    proy_id: number

    @Column({name: 'uuid', type: 'uuid'})
    uuid: string

    @Column({name: 'nombre', type: 'varchar'})
    nombre: string

    @Column({name: 'area_resp', type: 'varchar'})
    area_resp: string

    @Column({name: 'comentario', type: 'text'})
    comentario: string

    @Column({name: 'msj', type: 'text'})
    msj: string

    @CreateDateColumn({name:'created_at'})
    created_at: Date;
}