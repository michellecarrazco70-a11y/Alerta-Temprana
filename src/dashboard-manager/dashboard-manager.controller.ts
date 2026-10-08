import { Body, Controller, Post, Query, Get, Delete, Param, ParseIntPipe } from '@nestjs/common';
import { TypePermissions } from '../common/enums/access.enum';
import { GetCurrentUserId, GetCurrentUserUid, Permissions } from '../common/decorators/commons.decorator';
import { addDashboard } from './dto/add-dashboard.dto'
import { DashboardManagerService } from './dashboard-manager.service';
import { DahboardManagerDto } from './dto/dashboard-manager.dto';

@Controller('dashboard-manager')
@Permissions(TypePermissions.DASHBOARD_MANAGER_MODULE)
export class DashboardManagerController {

    constructor(private readonly dashService: DashboardManagerService){}

    /**
     * Crea un nuevo dashboard en la tabla dashboard
     * @param addDashboard 
     * @returns 
     */
    @Post()
    async create(@Body() addDashboard: DahboardManagerDto, @GetCurrentUserUid() uid: string){
        console.log(addDashboard)
        const newDash = await this.dashService.create({...addDashboard, created_at: new Date(), updated_at: new Date()}, uid)
        return {...newDash}
    }

    /**
     * 
     * @param addUserDashboard Objecto relacion uid con primary key de un dashboard
     * @returns 
     */
    @Post('add-user-dashboard')
    async createDashboard(@Body() addUserDashboard: any, @GetCurrentUserUid() uid: string){
        const newUserDashboard = await this.dashService.createUserDashboard(addUserDashboard, uid)
        return newUserDashboard
    }

    /**
     * Cambia el valor de la visibilidad en una relacion usuario dashboard
     * @param key Primary key de la relacion
     * @param newVisibilityVal Nuevo valor que tomara la visibilidad
     * @returns success o undefined
     */
    @Post('toggle-visibility/:key')
    async toggleVisibility(@Param('key', ParseIntPipe) key: number, @Body() newVisibilityVal: boolean, @GetCurrentUserUid() uid: string){
        const toggleRes = await this.dashService.updateVisibility(key, newVisibilityVal, uid)
        return toggleRes
    }

    @Post('edit/:pk/name/:newName')
    async editName(@Param('pk', ParseIntPipe) pk: number, @Param('newName') newName: string, @GetCurrentUserUid() uid: string){
        console.log(pk, newName)
        const editRes = await this.dashService.editName(pk, newName, uid)
        return editRes
    }

    /**
     * Edita la dependencia de un dashboard guardada en la base de datos 
     * @param pk 
     * @param newOrg 
     * @param uid 
     * @returns 
     */
    @Post('edit/:pk/dep/:newDep')
    async editDep(@Param('pk', ParseIntPipe) pk: number, @Param('newDep') newDep: string, @GetCurrentUserUid() uid: string){
        const editRes = await this.dashService.editDep(pk, newDep, uid)
        return editRes
    }

    @Post('edit/:pk/unidad/:newUnidad')
    async editUnidad(@Param('pk', ParseIntPipe) pk: number, @Param('newUnidad') newUnidad: string, @GetCurrentUserUid() uid: string){
        const editRes = await this.dashService.editUnidad(pk, newUnidad, uid)
        return editRes
    }
    
    @Post('edit/:pk/area/:newArea')
    async editArea(@Param('pk', ParseIntPipe) pk: number, @Param('newArea') newArea: string, @GetCurrentUserUid() uid: string){
        const editRes = await this.dashService.editArea(pk, newArea, uid)
        return editRes
    }

    @Post('edit/:pk/link')
    async editLink(@Param('pk', ParseIntPipe) pk: number, @Body() bodyObj: any, @GetCurrentUserUid() uid: string){
        console.log(bodyObj)
        const editRes = await this.dashService.editLink(pk, bodyObj.newLink, uid)
        return editRes
    }

    @Post('edit/:pk/desc/:newDesc')
    async editDesc(@Param('pk', ParseIntPipe) pk: number, @Param('newDesc') newDesc: string, @GetCurrentUserUid() uid: string){
        const editRes = await this.dashService.editDesc(pk, newDesc, uid)
        return editRes
    }

    @Post('edit/:pk/img')
    async editImgDash(@Param('pk', ParseIntPipe) pk:number, @Body() bodyObj: any, @GetCurrentUserUid() uid: string){
        return await this.dashService.editImgDash(pk, bodyObj)
    }

    @Post('orgs')
    async createOrg(@Body() createPayload: any, @GetCurrentUserUid() uid: string){
        const createRes = await this.dashService.createOrg(createPayload, uid)
        return createRes
    }

    @Post('orgs/edit/:pk/:newValOrg')
    async editOrgName(@Param('pk', ParseIntPipe) pk: number, @Param('newValOrg') newName: string, @GetCurrentUserUid() uid: string){
        const editRes = await this.dashService.editOrgName(pk,newName,uid)
        return editRes
    }

    /**
     * Obtiene todos los dashboards en la tabla dashboards
     * @returns Arreglo de dashboards registrados en la tabla dashboards
     */
    @Get()
    async getAll(){
        const allDash = await this.dashService.getAllDash();
        return allDash
    }

    /**
     * Obtiene todas las relaciones entre usuarios y dashboards,
     * accede al repositorio (Tabla) de dashboard-users
     * 
     * @param pk Primary key del Dashboard en la base de datos
     * @returns Un arreglo de relaciones usuario-dashboard
     */
    @Get(':pk/users')
    getAllDashboardUsers(@Param('pk', ParseIntPipe) pk: number){
        return this.dashService.getAllDashboardUsers(pk)
    }

    /**
     * 
     * @param uid 'uuid' del usuario en la tabla users
     * @returns 
     */
    @Get('get-user-name-by-id/:uid')
    async getUserNameById(@Param('uid') uid: string){
        const name = await this.dashService.getUserNameById(uid)
        return {nombreCompleto: name}
    }

    /**
     * Obtiene todos los usuarios registrados en la tabla users
     * @returns Arreglo de usuarios de la tabla users
     */
    @Get('all-usrs')
    getAllUsers(){
        return this.dashService.allUsers()
    }

    @Get('orgs')
    async getAllOrgs(){
        return await this.dashService.getAllOrgs()
    }

    @Get('logs/:page/:limit')
    async getAllLogs(
        @Param('page', ParseIntPipe) page: number = 1,
        @Param('limit', ParseIntPipe) limit: number = 100,
    ) {
        limit = limit > 100 ? 100 : limit; // Optional: enforce a max limit
        const data = await this.dashService.getAllLogs({
            page,
            limit,
        });
        return {
            data: data.logs,
            total: data.total,
            page: page,
            limit: limit
        };
    }

    @Get('dependencias')
    async getDep(){
        return this.dashService.getDependencias()
    }

    @Get('unidades')
    async getUnidadesResp(){
        return this.dashService.getUnidadesResponsable()
    }

    /**
     * Borra un dashboard
     */
    @Delete(':pk/delete')
    async delete(@Param('pk', ParseIntPipe) pk: number,@GetCurrentUserUid() uid: string,): Promise<void> {
        // Obtiene todos los usuarios relacionados con ese dash
        const allUsersInDashboard = await this.getAllDashboardUsers(pk)
        // Si hay relaciones entonces
        for(let rel of allUsersInDashboard){
            // Borra todas las relaciones utilizando su primary key
            await this.dashService.deleteDashRelation(rel.key, uid)
        }
        return this.dashService.delete(pk, uid)
    }

    /**
     * Borra un registro utilizando su primary key en la tabla dashboard-user
     * @param relationPkey Primary key de la relacion en la tabla dashboard-user
     * @returns 
     */
    @Delete('user-dashboard/:key')
    deleteDashRelation(@Param('key', ParseIntPipe) relationPkey: number, @GetCurrentUserUid() uid: string){
        return this.dashService.deleteDashRelation(relationPkey, uid)
    }

    @Delete('orgs/:pk')
    async deleteOrg(@Param('pk', ParseIntPipe) pk: number, @GetCurrentUserUid() uid: string){
        return this.dashService.deleteOrg(pk, uid)
    }

    
}
