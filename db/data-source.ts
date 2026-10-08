import { DataSourceOptions, DataSource } from 'typeorm';
import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ override: true });

const dataSource = new DataSource(dataSourceOption());
console.log('DB_HOST', process.env.DB_HOST);
console.log('DB_USER', process.env.DB_USER);

export function dataSourceOption(): DataSourceOptions {
	return {
		type: 'postgres',
		host: process.env.DB_HOST,
		port: parseInt(process.env.DB_PORT),
		username: process.env.DB_USER,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_DATABASE,
		entities: [path.join(__dirname, '../src/**/*.entity.{js,ts}') ],
		migrations: [path.join(__dirname, '../db/migrations/*.{js,ts}')],
		logging: process.env.PRODUCTION == 'false',
		cache: false
	};
}

export default dataSource;
