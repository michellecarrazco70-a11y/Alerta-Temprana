import { MigrationInterface, QueryRunner } from "typeorm"

export class AddIndiceEmpalmeEntrevistas1793688618526 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS uq_adr_entrevistas_voceria_fecha_hora
            ON "usr"."adr_entrevistas" (voceria_id, fecha, hora)
            WHERE deleted_at IS NULL;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX IF EXISTS "usr"."uq_adr_entrevistas_voceria_fecha_hora";
        `);
    }

}
