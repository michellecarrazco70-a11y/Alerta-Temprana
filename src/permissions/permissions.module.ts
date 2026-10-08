import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionsService } from './permissions.service';
import { PermissionsController } from './permissions.controller';
import { IsPermissionNameUnique } from '../common/validators/unique-permission-name.validator';
import { Group, Permission, PermissionRole, Role, User } from '../entities';

@Module({
	imports: [TypeOrmModule.forFeature([Permission, Role, Group, PermissionRole, User])],
	controllers: [PermissionsController],
	providers: [PermissionsService, IsPermissionNameUnique]
})
export class PermissionsModule { }
