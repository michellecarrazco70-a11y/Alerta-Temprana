import { Injectable } from "@nestjs/common";
import { Client } from "pg";

@Injectable()
export class SeccionesService {
    secciones_host = process.env.SECCIONES_PG_HOST;
    secciones_user = process.env.SECCIONES_PG_USER;
    secciones_password = process.env.SECCIONES_PG_PASSWORD;
	secciones_port = process.env.SECCIONES_DB_PORT;
	
	constructor() {}

	async getSeccionesFromRemoteDb() {
		const client = new Client({
			host: this.secciones_host,
			port: this.secciones_port,
			user: this.secciones_user,
			password: this.secciones_password,
			database: process.env.SECCIONES_DB_NAME,
		});

		try {
			await client.connect();

			const result = await client.query(`
                SELECT *
                FROM secciones_features;
            `);

			return result.rows;
		} finally {
			await client.end();
		}
	}
}

