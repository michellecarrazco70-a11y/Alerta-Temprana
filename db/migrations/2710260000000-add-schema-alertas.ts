import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAdrAlertasTempranas2710260000000 implements MigrationInterface {

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "usr"."adr_alertas_tempranas" (
                id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
                patologia VARCHAR(191) NOT NULL,
                fecha DATE NOT NULL,
                municipio VARCHAR(150) NOT NULL,
                localidad VARCHAR(191),
                numero_casos INTEGER NOT NULL CHECK (numero_casos >= 0),
                created_by INTEGER NOT NULL,
                updated_by INTEGER,
                deleted_by INTEGER,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                deleted_at TIMESTAMP
            );
        `);

		await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_adr_alertas_fecha
            ON "usr"."adr_alertas_tempranas" (fecha DESC)
            WHERE deleted_at IS NULL;
        `);

		await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_adr_alertas_patologia
            ON "usr"."adr_alertas_tempranas" (patologia)
            WHERE deleted_at IS NULL;
        `);

		await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_adr_alertas_municipio
            ON "usr"."adr_alertas_tempranas" (municipio)
            WHERE deleted_at IS NULL;
        `);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TABLE IF EXISTS "usr"."adr_alertas_tempranas";`);
	}

}