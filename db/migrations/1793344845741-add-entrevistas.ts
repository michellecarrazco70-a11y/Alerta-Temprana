import { MigrationInterface, QueryRunner } from "typeorm"

export class AddEntrevistas1793344845741 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
    CREATE TABLE IF NOT EXISTS "usr"."adr_entrevistas" (
        id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,

        tema_id INTEGER NOT NULL,
        voceria_id INTEGER NOT NULL,
        medio_id INTEGER NOT NULL,

        fecha DATE NOT NULL,
        hora TIME NOT NULL,
        via VARCHAR(20) NOT NULL
            CHECK (via IN ('presencial', 'telefonica')),

        created_by INTEGER NOT NULL,
        updated_by INTEGER,
        deleted_by INTEGER,

        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP,

        CONSTRAINT fk_adr_entrevistas_tema
            FOREIGN KEY (tema_id) REFERENCES "usr"."adr_temas"(id),
        CONSTRAINT fk_adr_entrevistas_voceria
            FOREIGN KEY (voceria_id) REFERENCES "usr"."adr_vocerias"(id),
        CONSTRAINT fk_adr_entrevistas_medio
            FOREIGN KEY (medio_id) REFERENCES "usr"."adr_medios"(id)
    );
`);

        await queryRunner.query(`
    CREATE INDEX IF NOT EXISTS idx_adr_entrevistas_fecha_hora
    ON "usr"."adr_entrevistas" (fecha, hora)
    WHERE deleted_at IS NULL;
`);

        await queryRunner.query(`
    CREATE INDEX IF NOT EXISTS idx_adr_entrevistas_voceria
    ON "usr"."adr_entrevistas" (voceria_id)
    WHERE deleted_at IS NULL;
`);

        await queryRunner.query(`
    CREATE INDEX IF NOT EXISTS idx_adr_entrevistas_medio
    ON "usr"."adr_entrevistas" (medio_id)
    WHERE deleted_at IS NULL;
`);

        await queryRunner.query(`
    CREATE INDEX IF NOT EXISTS idx_adr_entrevistas_tema
    ON "usr"."adr_entrevistas" (tema_id)
    WHERE deleted_at IS NULL;
`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "usr"."adr_entrevistas";`);
    }

}
