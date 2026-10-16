
import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSchemaMedia1792100000000 implements MigrationInterface {
    name = 'AddSchemaMedia1792100000000';

    public async up(queryRunner: QueryRunner): Promise<void> {

        // ============================================
        // 1. COLUMNAS FALTANTES EN USERS
        // ============================================

        await queryRunner.query(`
            ALTER TABLE "usr"."users"
            ADD COLUMN IF NOT EXISTS "org" VARCHAR(191);
        `);

        await queryRunner.query(`
            ALTER TABLE "usr"."users"
            ADD COLUMN IF NOT EXISTS "puesto" VARCHAR(191);
        `);

        // ============================================
        // 2. COLUMNA FALTANTE EN ROLES
        // ============================================

        await queryRunner.query(`
            ALTER TABLE "usr"."roles"
            ADD COLUMN IF NOT EXISTS "desc"
            VARCHAR NOT NULL DEFAULT '';
        `);

        // ============================================
        // 3. TABLA DE RIESGOS MEDIATICOS
        // ============================================

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "usr"."adr_riesgos_mediaticos" (
                id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

                uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,

                tipo VARCHAR(20) NOT NULL
                    CHECK (tipo IN ('mediatico', 'noticia')),

                titulo VARCHAR(500) NOT NULL,
                fuente VARCHAR(191) NOT NULL,
                fecha DATE NOT NULL,
                link VARCHAR(2048) NOT NULL,

                estatus VARCHAR(40),
                clasificacion VARCHAR(20),
                nivel_riesgo VARCHAR(20),
                tendencia BOOLEAN NOT NULL DEFAULT FALSE,
                descripcion TEXT,

                created_by INTEGER NOT NULL,
                updated_by INTEGER,
                deleted_by INTEGER,

                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                deleted_at TIMESTAMP
            );
        `);

        // ============================================
        // 4. TABLA DE ARCHIVOS MULTIMEDIA
        // ============================================

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "usr"."adr_media" (
                id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

                riesgo_id INTEGER NOT NULL,

                nombre_archivo VARCHAR(255) NOT NULL,
                extension VARCHAR(20),
                mime_type VARCHAR(150) NOT NULL,
                size_bytes INTEGER NOT NULL,

                archivo BYTEA NOT NULL,

                uploaded_by INTEGER NOT NULL,
                deleted_by INTEGER,

                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                deleted_at TIMESTAMP,

                CONSTRAINT fk_adr_media_riesgo
                    FOREIGN KEY (riesgo_id)
                    REFERENCES "usr"."adr_riesgos_mediaticos"(id)
            );
        `);

        // ============================================
        // 5. INDICES
        // ============================================

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_adr_riesgos_fecha
            ON "usr"."adr_riesgos_mediaticos" (fecha DESC)
            WHERE deleted_at IS NULL;
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_adr_riesgos_tipo
            ON "usr"."adr_riesgos_mediaticos" (tipo)
            WHERE deleted_at IS NULL;
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_adr_media_riesgo
            ON "usr"."adr_media" (riesgo_id)
            WHERE deleted_at IS NULL;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {

        // Eliminar primero la tabla dependiente
        await queryRunner.query(`
            DROP TABLE IF EXISTS "usr"."adr_media";
        `);

        await queryRunner.query(`
            DROP TABLE IF EXISTS "usr"."adr_riesgos_mediaticos";
        `);

        // Los indices se eliminan con sus tablas

        await queryRunner.query(`
            ALTER TABLE "usr"."roles"
            DROP COLUMN IF EXISTS "desc";
        `);

        await queryRunner.query(`
            ALTER TABLE "usr"."users"
            DROP COLUMN IF EXISTS "puesto";
        `);

        await queryRunner.query(`
            ALTER TABLE "usr"."users"
            DROP COLUMN IF EXISTS "org";
        `);
    }
}
