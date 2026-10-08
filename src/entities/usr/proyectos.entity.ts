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

@Entity({ name: 'proyectos', schema: 'usr' })
export class proyectos {
    @PrimaryGeneratedColumn()
    proy_id: number;

    @Column({name:'uuid', type: 'uuid'})
    uuid: string;

    @Column({name:'escolaborado', type: 'boolean'})
    escolaborado: string;

    @Column({name:'proyecto', type: 'varchar'})
    proyecto: string;

    @Column({name:'nombre_proy', type: 'varchar'})
    nombre_proy: string;

    @Column({name:'area_sol', type: 'varchar'})
    area_sol: string;

    @Column({name:'estado', type: 'varchar'})
    estado: string;

    @Column({name:'fecha_solicitud', type: 'timestamp'})
    fecha_solicitud: Date;

    @Column({name:'fecha_finalizacion', type: 'timestamp'})
    fecha_finalizacion: Date;

    @Column({name:'fecha_inicio', type: 'timestamp'})
    fecha_inicio: Date;

    @Column({name:'fecha_liberacion', type: 'timestamp'})
    fecha_liberacion: Date;

    @Column({name: 'nombre_solicitante', type: 'varchar'})
    nombre_solicitante: string;

    @Column({name: 'area_resp', type: 'varchar'})
    area_resp: string;

    @Column({name: 'dependencia', type: 'varchar'})
    dependencia: string;

    @Column({name: 'responsable', type: 'varchar'})
    responsable: string;

    @Column({name:'visible', type: 'bool'})
    visible: boolean;

    @Column({name: 'ud_admva', type: 'varchar'})
    ud_admva: string;

    @Column({name: 'dep_clave', type: 'int4'})
    dep_clave: number;

    @Column({name: 'cg_clave', type: 'int8'})
    cg_clave: number;

    @Column({name: 'comentario', type: 'text'})
    comentario: string;

    @Column({name:'avances', type: 'integer'})
    avances: number;

    @Column({name:'created_at', type: 'timestamp'})
    created_at: Date;

    @Column({name:'updated_at', type: 'timestamp'})
    updated_at: Date;

}