import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Log, User } from 'src/entities';
import { DashboardUserController } from './dashboard-user.controller';
import { DashboardUserService } from './dashboard-user.service';

@Module({
    imports: [TypeOrmModule.forFeature([ Log, User])],
    controllers: [DashboardUserController],
    providers: [DashboardUserService]
})
export class DashboardUserModule {}
