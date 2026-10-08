import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';
import { IsGroupNameUnique } from '../common/validators/unique-group-name.validator';
import { Group, Permission, User } from '../entities';

@Module({
	imports: [TypeOrmModule.forFeature([Permission, Group, User])],
	controllers: [GroupsController],
	providers: [GroupsService, IsGroupNameUnique],
})
export class GroupsModule { }
