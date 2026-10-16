import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedInitial1686431827163 implements MigrationInterface {
	name = "SeedInitial1686431827163";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
            INSERT INTO usr.roles (
                "name", route, active, "order", created_by
            )
            VALUES ('ADMINISTRADOR', NULL, true, 0, NULL)
            ON CONFLICT DO NOTHING;

            INSERT INTO usr."groups" ("name", active, "order")
            VALUES ('USUARIOS', true, 0)
            ON CONFLICT DO NOTHING;

            INSERT INTO usr."groups" ("name", active, "order")
            VALUES ('ROLES', true, 0)
            ON CONFLICT DO NOTHING;

            INSERT INTO usr."groups" ("name", active, "order")
            VALUES ('PERMISSONS', true, 0)
            ON CONFLICT DO NOTHING;

            INSERT INTO usr."groups" ("name", active, "order")
            VALUES ('GRUPOS', true, 0)
            ON CONFLICT DO NOTHING;

            INSERT INTO usr.permissions (
                "name", active, "order", "groupId"
            )
            VALUES ('ACCESO MODULO DE USUARIOS', true, 0, 1)
            ON CONFLICT DO NOTHING;

            INSERT INTO usr.permissions (
                "name", active, "order", "groupId"
            )
            VALUES ('ACCESO MODULO DE ROLES', true, 0, 2)
            ON CONFLICT DO NOTHING;

            INSERT INTO usr.permissions (
                "name", active, "order", "groupId"
            )
            VALUES ('ACCESO MODULO DE PERMISOS', true, 0, 3)
            ON CONFLICT DO NOTHING;

            INSERT INTO usr.permissions (
                "name", active, "order", "groupId"
            )
            VALUES ('ACCESO MODULO DE GRUPOS', true, 0, 4)
            ON CONFLICT DO NOTHING;

            INSERT INTO usr.permission_roles (role_id, permission_id)
            VALUES (1, 1);

            INSERT INTO usr.permission_roles (role_id, permission_id)
            VALUES (1, 2);

            INSERT INTO usr.permission_roles (role_id, permission_id)
            VALUES (1, 3);

            INSERT INTO usr.permission_roles (role_id, permission_id)
            VALUES (1, 4);

            INSERT INTO usr.users (
                rfc,
                employee_number,
                curp,
                job,
                "name",
                first_name,
                second_name,
                email,
                "password",
                created_by,
                hashed_rt,
                active,
                "order"
            )
            VALUES (
                'RFCDEMO000001',
                '000001',
                'CURPDEMO0000000001',
                'ADMINISTRADOR',
                'USUARIO',
                'PRUEBA',
                'PRUEBA',
                'admin@admin.com',
                '$2b$10$a9wDaK9cTHePveAWO5CkjOWiBLHnGQxUKRM7Sy/KqNH007g0y4ePK',
                0,
                NULL,
                true,
                NULL
            )
            ON CONFLICT (email) DO NOTHING;

            INSERT INTO usr.role_users (role_id, user_id)
            VALUES (1, 1);
        `);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
            DELETE FROM usr.role_users
            WHERE user_id IN (
                SELECT id FROM usr.users
                WHERE email = 'admin@admin.com'
            );

            DELETE FROM usr.permission_roles
            WHERE role_id IN (
                SELECT id FROM usr.roles
                WHERE "name" = 'ADMINISTRADOR'
            );

            DELETE FROM usr.users
            WHERE email = 'admin@admin.com';

            DELETE FROM usr.permissions
            WHERE "name" IN (
                'ACCESO MODULO DE USUARIOS',
                'ACCESO MODULO DE ROLES',
                'ACCESO MODULO DE PERMISOS',
                'ACCESO MODULO DE GRUPOS'
            );

            DELETE FROM usr."groups"
            WHERE "name" IN (
                'USUARIOS',
                'ROLES',
                'PERMISSONS',
                'GRUPOS'
            );

            DELETE FROM usr.roles
            WHERE "name" = 'ADMINISTRADOR';
        `);
	}
}
