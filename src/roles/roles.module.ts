import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { IsRoleNameUnique } from '../common/validators/unique-role-name.validator';
import { Permission, PermissionRole, Role, RoleUser, User } from '../entities';

@Module({
	imports: [
		// TypeOrmModule.forFeature([Role, Permission, PermissionRole, RoleUser, User]),
		TypeOrmModule.forFeature([Role, PermissionRole]),
	],
	controllers: [RolesController],
	providers: [RolesService, IsRoleNameUnique],
})
export class RolesModule { }
