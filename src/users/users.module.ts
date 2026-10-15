import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IsEmailNotRegistered } from '../common/validators/email-validation';
import { IsNameUnique } from '../common/validators/unique-name-validation';
import { Permission, PermissionRole, Role, RoleUser, User, UserTokens } from '../entities';
import { ProfileController } from './profile.controller';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { MailProvider } from '../common/providers/mail.provider';

@Module({
	imports: [
                TypeOrmModule.forFeature([User, Role, RoleUser, UserTokens, Permission, PermissionRole]),
        ],
	controllers: [UsersController, ProfileController],
	providers: [
		UsersService,
		ConfigService,
		IsEmailNotRegistered,
		IsNameUnique,
		MailProvider
	],
	exports: [UsersService],
})
export class UsersModule { }
