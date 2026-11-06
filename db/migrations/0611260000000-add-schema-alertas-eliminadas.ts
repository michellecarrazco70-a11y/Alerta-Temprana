import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSchemaAlertasEliminadas0611260000000 implements MigrationInterface {
	name = 'AddSchemaAlertasEliminadas0611260000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			CREATE TABLE IF NOT EXISTS "usr"."adr_alertas_tempranas_eliminadas" (
				id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
				uuid_original UUID NOT NULL,
				patologia VARCHAR(191) NOT NULL,
				fecha DATE NOT NULL,
				municipio VARCHAR(150) NOT NULL,
				localidad VARCHAR(191),
				numero_casos INTEGER NOT NULL CHECK (numero_casos >= 0),
				created_by_original INTEGER,
				created_at TIMESTAMP,
				deleted_by INTEGER,
				deleted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
			);
		`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			DROP TABLE IF EXISTS "usr"."adr_alertas_tempranas_eliminadas";
		`);
	}
}