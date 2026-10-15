import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { DashboardUserService } from './dashboard-user.service';
import { GetCurrentUserUid } from 'src/common/decorators/commons.decorator';

@Controller('dashboard-user')
export class DashboardUserController {

    constructor(private dashUserService: DashboardUserService){

    }

    @Get(':uid')
    async getAllUserDashboards(@Param('uid') uid: string){
        return this.dashUserService.getAllUserDashboards(uid)
    }
}
