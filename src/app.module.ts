import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { GroupsModule } from './groups/groups.module';
import { PermissionsModule } from './permissions/permissions.module';
import { RolesModule } from './roles/roles.module';
import { UsersModule } from './users/users.module';
import { dataSourceOption } from '../db/data-source';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AccessTokenGuard } from './common/guards/access-token.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { SystemLogsModule } from './system-logs/system-logs.module';
import { DashboardUserModule } from './dashboard-user/dashboard-user.module';
import { RiesgoMediaticoModule } from './riesgo-mediatico/riesgo-mediatico.module';


@Module({
	imports: [
		ThrottlerModule.forRoot({
			ttl: 60,
			limit: 100,
		}),
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		TypeOrmModule.forRoot(dataSourceOption()),
		SystemLogsModule,
		UsersModule,
		AuthModule,
		PermissionsModule,
		RolesModule,
		GroupsModule,
		DashboardUserModule,
		RiesgoMediaticoModule,
	],
	controllers: [],
	providers: [
		{
			provide: APP_GUARD,
			useClass: ThrottlerGuard
		},
		{
			provide: APP_FILTER,
			useClass: GlobalExceptionFilter,
		},
		{
			provide: APP_GUARD,
			useClass: AccessTokenGuard,
		},
		{
			provide: APP_GUARD,
			useClass: PermissionsGuard,
		},
	],
})
export class AppModule { }
