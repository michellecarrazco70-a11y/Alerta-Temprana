import { MigrationInterface, QueryRunner } from "typeorm";

export class MigracionInicial1707239624470 implements MigrationInterface {
    name = 'MigracionInicial1707239624470'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "usr"."users" ALTER COLUMN "uuid" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "usr"."users" ALTER COLUMN "uuid" SET DEFAULT gen_random_uuid()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "usr"."users" ALTER COLUMN "uuid" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "usr"."users" ALTER COLUMN "uuid" SET DEFAULT uuid_generate_v4()`);
    }

}
