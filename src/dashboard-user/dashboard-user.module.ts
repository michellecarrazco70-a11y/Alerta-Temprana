import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Dashboard, Log, User, dashboard_user } from 'src/entities';
import { DashboardUserController } from './dashboard-user.controller';
import { DashboardUserService } from './dashboard-user.service';

@Module({
    imports: [TypeOrmModule.forFeature([dashboard_user, Dashboard, Log, User])],
    controllers: [DashboardUserController],
    providers: [DashboardUserService]
})
export class DashboardUserModule {}
