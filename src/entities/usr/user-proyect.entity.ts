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

@Entity({ name: 'user_proyecto', schema: 'usr' })
export class userProyects {
    @PrimaryGeneratedColumn()
    pk: number;

    @Column({name: 'proy_id', type: 'int4'})
    proy_id: number

    @Column({name: 'avances', type: 'int4'})
    avances: number

    @Column({name:'uid', type: 'uuid'})
    uid: string;

    @Column({name:'created_at', type: 'timestamp'})
    created_at: Date;

    @Column({name:'updated_at', type: 'timestamp'})
    updated_at: Date;

    @Column({name:'deleted_at', type: 'timestamp'})
    deleted_at: Date;

    @Column({name:'visible', type: 'bool'})
    visible: boolean;

    @Column({name:'tiene_hijos', type: 'bool'})
    tiene_hijos: boolean;

    @Column({name:'hijos', type: 'text'})
    hijos: string;

    @Column({name: 'progreso', type: 'int4'})
    progreso: number

    @Column({name: 'comentario', type: 'varchar'})
    comentario: string

    @Column({name: 'proyecto', type: 'varchar'})
    proyecto: string

    @Column({name: 'estado', type: 'varchar'})
    estado: string

    @Column({name: 'nombre_proy', type: 'varchar'})
    nombre_proy: string

    @Column({name: 'nombre', type: 'varchar'})
    nombre: string

    @Column({name: 'area_resp', type: 'varchar'})
    area_resp: string

    @Column({name: 'fecha_inicio', type: 'timestamp'})
    fecha_inicio: Date

    @Column({name: 'fecha_liberacion', type: 'timestamp'})
    fecha_liberacion: Date

    @Column({name: 'fecha_finalizacion', type: 'timestamp'})
    fecha_finalizacion: Date
}