import { Body, Controller, Post, Patch, Query, Get, Delete, Param, ParseIntPipe, Ip, UseInterceptors, UploadedFile, UploadedFiles, Req, Res } from '@nestjs/common';
import { GetCurrentUserId, GetCurrentUserUid, Permissions } from '../common/decorators/commons.decorator';
import { TypePermissions } from '../common/enums/access.enum';
import { MapaService } from './mapa.service';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';

@Controller('mapa-red-troncal')
// @Permissions(TypePermissions.MAPA_RED_TRONCAL)
export class MapaTroncalController {

    constructor(private readonly mapaService: MapaService){}

    @Post('check-access')
    checkAccess(@GetCurrentUserId() user_id: number, @GetCurrentUserUid() uid: string){
        const res = this.mapaService.checkAccess(user_id, uid)
        return res
    }

    @Post('feature/update/:id')
    updateFeature(@Param('id', ParseIntPipe) id: number, @Body() feature: any){
        return this.mapaService._updateFeature(id, feature)
    }

    @Post('feature/:id/proveedores')
    updateProveedores(@Param('id', ParseIntPipe) id: number, @Body() feature: any){
        this.mapaService._updateProveedores(id, feature)
    }

    @Post('torres/enlaces/sync')
    syncTorresEnlaces(@Body() body: any){
        this.mapaService._syncTorresEnlaces(body)
    }

    @Post('feature/new')
    createFeature(@Body() feature: any, @GetCurrentUserUid() uid: string){
        return this.mapaService.createFeature(feature, uid)
    }
    

    @Post('feature/bulk')
    createFeatures(@Body() features: any[], @GetCurrentUserUid() uid: string) {
    return this.mapaService.createFeaturesFromArr(features, uid)
    }

    @Post('snapshot/:municipio')
    @UseInterceptors(FileInterceptor('file'))
    createSnapshot(
        @Param('municipio') municipio: string, 
        @GetCurrentUserId() id_user: string,
        @UploadedFile() file: Express.Multer.File,
        @Body() body: any
    ){
        const bbox = JSON.parse(body.bbox);

        if(!file){
            console.log('no file')
            throw new Error('No se encontro el archivo')
        }

        // console.log('Se recibio file', {
        //     filename: file.originalname,
        //     mimetype: file.mimetype,
        //     size: file.size
        // })

        return this.mapaService.createSnapshot(file, municipio, id_user, bbox)
    }

    @Post('delete/snapshot/:id')
    deleteSnapshot(@Param('id', ParseIntPipe) id: number, @GetCurrentUserId() id_user: number){
        return this.mapaService.deleteSnapshot(id, id_user)
    }

    @Post('upload/coberturas')
    @UseInterceptors(FilesInterceptor('files'))
    uploadCoberturas(@UploadedFiles() files: Express.Multer.File[]){
        return this.mapaService.handleCoberturas(files)
    }

    @Get()
    getAllFeatures(@GetCurrentUserId() uid: string){
        return this.mapaService.getAllFeatures()
    }

    @Get('/perfil')
    getPerfil(@GetCurrentUserId() id_user: number){
        return this.mapaService.getPerfil(id_user)
    }

    @Get('plantilla/:layer')
    getPlantilla(@Param('layer') layer: string){
        return this.mapaService.getPlantilla(layer)
    }

    @Get('perfil-template/default')
    getDefaultPerfilTemplate(@GetCurrentUserId() id_user: number) {
        return this.mapaService.getDefaultPerfilTemplate(id_user);
    }

    @Get('perfil/:uid')
    getPerfilById(@Param('uid') uid: string){
        const value = /^\d+$/.test(uid) ? Number(uid) : uid;
	    return this.mapaService.getPerfil(value);
    }

    @Get('all-perfiles')
    getAllPerfiles(@GetCurrentUserId() id_user: number){
        return this.mapaService.getAllPerfiles(id_user)
    }

    @Get('group/:groupName')
    getFeaturesByGroup(@Param('groupName') groupName: string){
        return this.mapaService.getFeaturesByGroup(groupName)
    }

    @Get('revise')
    getRevisedFeatures(@GetCurrentUserId() id_user: number){
        return this.mapaService.getRevisedFeatures(id_user)
    }

    @Get('is-admin')
    isAdmin(@GetCurrentUserId() id_user: number){
        return this.mapaService.isAdmin(id_user)
    }

    @Get('snapshot/:municipio')
    getSnapshot(@Param('municipio') municipio: string){
        return this.mapaService.getSnapshots(municipio)
    }

    @Get('coberturas')
    async getCoberturas(@GetCurrentUserId() id_user: number, @Req() req: any){

        const coberturas = await this.mapaService.getCoberturas(id_user)

        return coberturas
    }
}