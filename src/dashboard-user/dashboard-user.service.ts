import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GetCurrentUserUid } from 'src/common/decorators/commons.decorator';
import { dashboard_user, Dashboard, Log, User } from 'src/entities'
import { Repository } from 'typeorm';


@Injectable()
export class DashboardUserService {

    constructor(
        @InjectRepository(dashboard_user)
        private dashboardUserRepository: Repository<dashboard_user>,
        @InjectRepository(Dashboard)
        private dashboardRepository: Repository<Dashboard>,
        @InjectRepository(Log)
        private logger: Repository<Log>,
        @InjectRepository(User)
        private userRpository: Repository<User>
            
    ){

    }

    async log(action: string, context: string, message: string){
        const newLog = this.logger.create({
            action: action,
            context: context,
            message: message
        })
        await this.logger.save(newLog)
    }

    async getAllUserDashboards(uid: string){
        const userDashboards = await this.dashboardUserRepository.find({where:{
            user_id: uid,
            active: true
        }})
        return userDashboards
    }

    async getOneDash(pk: number){
        const dash = await this.dashboardRepository.findOne({where:{
            pk: pk
        }})

        if(!dash) throw new Error('No se encontro un dashboard')
        delete dash.link_powerbi
    
        return dash
    }

    async getInfo(pk: number, uid: string){
        const dash = await this.dashboardRepository.findOne({where:{
            pk: pk
        }})

        if(!dash) throw new Error('No se encontro un dashboard')

        this.log('ACCESO', 'ACCES', `El usuario ${await this.getUserNameById(uid)} acceso al dashboard ${dash.nombre}`)

        return dash
    }

    async checkAccess(relation: {uid: string, dashName: number}, uid: string){
        const rel = await this.dashboardUserRepository.findOne({where:{
            user_id: relation.uid,
            dashboard_pk: relation.dashName
        }})
        await this.log("ACCESS", "accessDash", `El usuario ${await this.getUserNameById(uid)} intento accesar al dash ${relation.dashName}`)
        if(!rel || !rel.active) {
            await this.log("NO ACCESS", "accessDash", `Se denego el acceso al dash ${relation.dashName} al usuario ${await this.getUserNameById(uid)}`)
            throw new Error('Acceso denegado')
        }

        return {success: true}
    }

    async checkAccessSec(uid: any){
        console.log('===============================')
        console.log('uid:',uid)
        const dashSec = await this.dashboardRepository.findOne({where: {nombre: 'Educación Especial'}})
        if(!dashSec) throw new HttpException('No existe el reporte de la SEC', HttpStatus.CONFLICT)
        const rel = await this.dashboardUserRepository.findOne({where: {
            user_id: uid,
            dashboard_pk: dashSec.pk
        }})
        await this.log("ACCESS", "accessDash", `El usuario ${await this.getUserNameById(uid)} intento accesar al dash ${dashSec.nombre}`)
        if(!rel || !rel.active) {
            await this.log("NO ACCESS", "accessDash", `Se denego el acceso al dash ${dashSec.nombre} al usuario ${await this.getUserNameById(uid)}`)
            throw new HttpException('Acceso denegado', HttpStatus.CONFLICT)
        }else{
            this.log('ACCESO', 'ACCES', `El usuario ${await this.getUserNameById(uid)} acceso al dashboard ${dashSec.nombre}`)
            return true
        }
    }

    async getUserNameById(uid:string){
        const usr = await this.userRpository.findOne({where:{ uuid: uid}})

        if (!usr) {
            // Handle the case where the user is not found
            throw new Error('User not found');
        }
    
        // Concatenate the name fields
        const completeName = `${usr.name} ${usr.firstName} ${usr.secondName}`.trim();
        return completeName;
    }
}
