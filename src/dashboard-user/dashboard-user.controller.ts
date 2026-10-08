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

    @Get('dashboard/:pk')
    async getOneDashboard(@Param('pk', ParseIntPipe) pk: number){
        return this.dashUserService.getOneDash(pk)
    }

    @Get('dashboard-access/:uid/:pk')
    async getInfo(@Param('uid') uid: string, @Param('pk', ParseIntPipe) pk: number){
        return await this.dashUserService.getInfo(pk, uid)
    }

    @Post('access-sec')
    async getAccessSec(@GetCurrentUserUid() uid: any){
        return this.dashUserService.checkAccessSec(uid)
    }

    /**
     * 
     * @param relation Relacion usuario dash, trae solo uid y dashName
     */
    @Post('check-access')
    checkAccessToDashboard(@Body() relation: {uid: string, dashName: number}, @GetCurrentUserUid() uid: string){
        return this.dashUserService.checkAccess(relation,uid)
    }
}
