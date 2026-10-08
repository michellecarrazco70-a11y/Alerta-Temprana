import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1686117824411 implements MigrationInterface {
	name = 'Initial1686117824411'

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`CREATE SCHEMA "usr"`);
		await queryRunner.query(`CREATE SCHEMA "sys"`);
		await queryRunner.query(`CREATE TABLE "sys"."logs" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "message" character varying, "context" character varying, "action" character varying, "user_id" integer, "data" jsonb, "stack" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_fb1b805f2f7795de79fa69340ba" PRIMARY KEY ("id"))`);
		await queryRunner.query(`CREATE TABLE "usr"."users" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, uuid uuid NOT NULL DEFAULT gen_random_uuid(), "rfc" character varying(13) NOT NULL, "employee_number" character varying(10) NOT NULL, "curp" character varying(20) NOT NULL, "name" character varying(191) NOT NULL, "first_name" character varying(191) NOT NULL, "second_name" character varying(191), "avatar" character varying(255), "email" character varying(191) NOT NULL, "password" character varying(255) NOT NULL, "suborganism_id" integer, "created_by" integer, "hashed_rt" character varying, "job" character varying NOT NULL, "active" boolean NOT NULL DEFAULT true, "order" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_b92d0e81f6c4da89a73851d34286" UNIQUE ("uuid"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
		await queryRunner.query(`CREATE TABLE "usr"."role_users" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "role_id" integer NOT NULL, "user_id" integer NOT NULL,"created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6b4286b64efea084922d1c709bd" PRIMARY KEY ("id"))`);
		await queryRunner.query(`CREATE TABLE "usr"."roles" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "name" character varying, "route" character varying, "active" boolean NOT NULL DEFAULT true, "order" integer, "created_by" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`);
		await queryRunner.query(`CREATE TABLE "usr"."permission_roles" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "role_id" integer NOT NULL, "permission_id" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1c354345d93728c25adca19d717" PRIMARY KEY ("id"))`);
		await queryRunner.query(`CREATE TABLE "usr"."permissions" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "name" character varying NOT NULL, "route" character varying, "active" boolean NOT NULL DEFAULT true, "order" integer, "created_by" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "groupId" integer, CONSTRAINT "PK_920331560282b8bd21bb02290df" PRIMARY KEY ("id"))`);
		await queryRunner.query(`CREATE TABLE "usr"."groups" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "name" character varying NOT NULL, "active" boolean NOT NULL DEFAULT true, "order" integer, "created_by" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "UQ_664ea405ae2a10c264d582ee563" UNIQUE ("name"), CONSTRAINT "PK_659d1483316afb28afd3a90646e" PRIMARY KEY ("id"))`);
		await queryRunner.query(`CREATE TABLE "usr"."user_tokens" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "user_id" integer NOT NULL, "type_token" character varying(50) NOT NULL, "token" character varying(70) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "expire_on" TIMESTAMP NOT NULL, CONSTRAINT "PK_63764db9d9aaa4af33e07b2f4bf" PRIMARY KEY ("id"))`);
		await queryRunner.query(`ALTER TABLE "usr"."role_users" ADD CONSTRAINT "FK_790a8ca58c37fd1f31944ae65e2" FOREIGN KEY ("role_id") REFERENCES "usr"."roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
		await queryRunner.query(`ALTER TABLE "usr"."role_users" ADD CONSTRAINT "FK_1dc3ce23874f906d8306186671a" FOREIGN KEY ("user_id") REFERENCES "usr"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
		await queryRunner.query(`ALTER TABLE "usr"."permission_roles" ADD CONSTRAINT "FK_e07d497132709affeef715a2b60" FOREIGN KEY ("role_id") REFERENCES "usr"."roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
		await queryRunner.query(`ALTER TABLE "usr"."permission_roles" ADD CONSTRAINT "FK_9173e2102ae416a0d07b0c574fc" FOREIGN KEY ("permission_id") REFERENCES "usr"."permissions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
		await queryRunner.query(`ALTER TABLE "usr"."permissions" ADD CONSTRAINT "FK_0ce20ad956af3961df1ff12d0c5" FOREIGN KEY ("groupId") REFERENCES "usr"."groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "usr"."permissions" DROP CONSTRAINT "FK_0ce20ad956af3961df1ff12d0c5"`);
		await queryRunner.query(`ALTER TABLE "usr"."permission_roles" DROP CONSTRAINT "FK_9173e2102ae416a0d07b0c574fc"`);
		await queryRunner.query(`ALTER TABLE "usr"."permission_roles" DROP CONSTRAINT "FK_e07d497132709affeef715a2b60"`);
		await queryRunner.query(`ALTER TABLE "usr"."role_users" DROP CONSTRAINT "FK_1dc3ce23874f906d8306186671a"`);
		await queryRunner.query(`ALTER TABLE "usr"."role_users" DROP CONSTRAINT "FK_790a8ca58c37fd1f31944ae65e2"`);
		await queryRunner.query(`DROP TABLE "usr"."user_tokens"`);
		await queryRunner.query(`DROP TABLE "usr"."groups"`);
		await queryRunner.query(`DROP TABLE "usr"."permissions"`);
		await queryRunner.query(`DROP TABLE "usr"."permission_roles"`);
		await queryRunner.query(`DROP TABLE "usr"."roles"`);
		await queryRunner.query(`DROP TABLE "usr"."role_users"`);
		await queryRunner.query(`DROP TABLE "usr"."users"`);
		await queryRunner.query(`DROP TABLE "sys"."logs"`);
		await queryRunner.query(`DROP SCHEMA "sys"`);
		await queryRunner.query(`DROP SCHEMA "usr"`);
	}

}
