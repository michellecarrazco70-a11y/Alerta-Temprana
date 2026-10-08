import { Body, Controller, Post, Patch, Query, Get, Delete, Param, ParseIntPipe, Ip } from '@nestjs/common';
import { GetCurrentUserId, GetCurrentUserUid, Permissions } from '../common/decorators/commons.decorator';
import { TypePermissions } from '../common/enums/access.enum';
import { ProyectosService } from './proyectos-service.service';

@Controller('project-manager')
@Permissions(TypePermissions.PROYECTOS)
export class ProyectosManagerController {

    constructor(private readonly proyectService: ProyectosService){}

    @Post()
    crearProyecto(@Body() data: any, @GetCurrentUserUid() uid: string){
        return this.proyectService.createProyecto(data, uid)
    }

    @Post('proyPadre')
    crearProyectoPadre(@Body() data: any, @GetCurrentUserUid() uid: string){
        return this.proyectService.createProyectoPadre(data, uid)
    }

    @Post('check-access')
    check_acces(@GetCurrentUserId() user_id: number){
        return this.proyectService.checkAccess(user_id)
    }

    @Post('delete/:proy_id')
    deleteProyect(@Param('proy_id', ParseIntPipe) proy_id: number, @GetCurrentUserUid() uid: string, @Body() msjObj: any){
        return this.proyectService.deleteProyecto(proy_id, msjObj.msj, uid)
    }

    @Post('avance')
    addAvance(@GetCurrentUserUid() uidAction: string, @Body() data: any){
        return this.proyectService.agregarAvance(uidAction, data)
    }

    @Post('avance-personal')
    addAvancePersonal(@GetCurrentUserUid() uid: string, @Body() data: any){
        return this.proyectService.agregaAvancePersonal(data, uid)
    }

    @Post('sub-proyecto')
    getSubProyecto(@Body() requestObj: any, @GetCurrentUserUid() uid: string){
        return this.proyectService.getSubProy(requestObj, uid)
    }

    @Post('edit/sub-proy/:pk')
    editSubProyecto(@Param('pk', ParseIntPipe) pk: number, @Body() changeFields: any){
        return this.proyectService.editSubProy(pk, changeFields)
    }

    @Post('edit/sub-proy/:pk/name/:newName')
    editNameSubProy(@Param('pk', ParseIntPipe) pk: number, @Param('newName') newName: string){
        console.log(pk, newName)
        return this.proyectService.editNameSubProy(pk, newName)
    }

    @Post('sub-proy/asign')
    asignUserToSubProy(@Body() asignObj: {uid: string, nombre: string, pk: number}){
        return this.proyectService.asignUsrSubProy(asignObj)
    }

    @Post('/create/sub-proy')
    createSubProy(@Body() data: any){
        return this.proyectService.createSubProy(data)
    }

    @Get('proyecto/:proy_id')
    getOneProy(@Param('proy_id',ParseIntPipe) proy_id: number){
        return this.proyectService.getOneProy(proy_id)
    }

    // Se cambiara
    @Get('proyectosRel')
    getProyectosRel(@GetCurrentUserUid() uid: string){
        return this.proyectService.getProyectosRel(uid)
    }

    // Se cambiara
    @Get('proyectos')
    getProyectos(@GetCurrentUserUid() uid: string){
        return this.proyectService.getProyectos(uid)
    }

    @Get('dependencias')
    getDep(){
        return this.proyectService.getDependencias()
    }

    @Get('unidades')
    getUnidadesResp(){
        return this.proyectService.getUnidadesResponsables()
    }

    @Get('usuarios_DGSIF')
    getUsersDGSIF(@GetCurrentUserUid() uidAction: string){
        return this.proyectService.getUsersDGSIF(uidAction)
    }

    @Get('avances/:proy_id')
    getAvances(@Param('proy_id', ParseIntPipe) proy_id: number, @GetCurrentUserUid() uid: string){
        return this.proyectService.getAvances(proy_id, uid)
    }

    @Get('comentarios/:proy_id/:area')
    getComentarios(@Param('proy_id', ParseIntPipe) proy_id: number, @Param('area') area: string){
        return this.proyectService.getComentarios(proy_id, area)
    }

    @Patch(':proy_id')
    patchProy(@Param('proy_id', ParseIntPipe) proy_id: number, @Body() updateFields: any, @GetCurrentUserUid() uid: string){
        return this.proyectService.patchProy(updateFields, proy_id, uid)
    }

    @Delete(':proy_id')
    deleteProyecto(@Param('proy_id', ParseIntPipe) proy_id, @Body() mensajeObj: {mensaje: string}, @GetCurrentUserUid() uid: string, @Ip() ip: any){
        console.log("===============================")
        console.log(ip)
        return this.proyectService.deleteProyecto(proy_id,mensajeObj.mensaje, uid)
    }

    @Delete('sub-proy/:pk')
    deleteSubProy(@Param('pk', ParseIntPipe) pk: number){
        return this.proyectService.deleteSubProy(pk)
    }
}