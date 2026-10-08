import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity({name: 'dashboard-users', schema: 'usr'})
export class dashboard_user{
    @PrimaryGeneratedColumn()
    key: number;

    @Column({type: 'int4', nullable: false})
    dashboard_pk: number;

    @Column({type: 'uuid', nullable: false})
    user_id: string;

    @Column({type: 'bool', nullable: false})
    active: boolean;

    @Column({type: 'uuid', nullable: false})
    created_by: string;

    @CreateDateColumn({
        name: 'created_at',
        type: 'timestamp',
        default: ()=>'CURRENT_TIMESTAMP'
    })
    created_at: Date;

    @UpdateDateColumn({
        name: 'updated_at',
        type: 'timestamp',
        default: ()=> 'CURRENT_TIMESTAMP'
    })
    updated_at: Date;
}