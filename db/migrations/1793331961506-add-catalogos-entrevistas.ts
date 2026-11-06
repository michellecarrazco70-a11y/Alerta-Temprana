import { MigrationInterface, QueryRunner } from "typeorm"

export class AddCatalogosEntrevistas1793331961506 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        for (const tabla of ['adr_temas', 'adr_vocerias', 'adr_medios']) {
            await queryRunner.query(`
           CREATE TABLE IF NOT EXISTS "usr"."${tabla}" (
               id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
               uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
               nombre VARCHAR(191) NOT NULL,
               created_by INTEGER NOT NULL,
               updated_by INTEGER,
               deleted_by INTEGER,
               created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
               updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
               deleted_at TIMESTAMP
           );
       `);

            await queryRunner.query(`
           CREATE UNIQUE INDEX IF NOT EXISTS uq_${tabla}_nombre
           ON "usr"."${tabla}" (lower(btrim(nombre)))
           WHERE deleted_at IS NULL;
       `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "usr"."adr_medios";`);
        await queryRunner.query(`DROP TABLE IF EXISTS "usr"."adr_vocerias";`);
        await queryRunner.query(`DROP TABLE IF EXISTS "usr"."adr_temas";`);
    }

}
