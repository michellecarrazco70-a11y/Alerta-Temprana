import { HttpCode, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Dashboard, Log, User, dashboard_user, organizaciones } from 'src/entities';
import { IsNull, Not, Repository } from 'typeorm';
import { addDashboard } from './dto/add-dashboard.dto';
import { DahboardManagerDto } from './dto/dashboard-manager.dto';
import * as fs from 'fs'

@Injectable()
export class DashboardManagerService {
    constructor(
        @InjectRepository(Dashboard)
        private dashboardsRepository: Repository<Dashboard>,
        @InjectRepository(dashboard_user)
        private dashboardUserRepository: Repository<dashboard_user>,
        @InjectRepository(User)
        private userRep: Repository<User>,
        @InjectRepository(organizaciones)
        private orgReposiotry: Repository<organizaciones>,
        @InjectRepository(Log)
        private logger: Repository<Log>
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

    /**
     *  Crea un dashboard en la tabla dashboards
     * @param dashData Objeto con los datos del dashboard a guardar
     * @returns 
     */
    async create(dashData: DahboardManagerDto, uid: string): Promise<DahboardManagerDto> {
        try {
          // Convert base64 image to Buffer
          let dashboard_img: Buffer | null = null;
          if (dashData.image_data) {
            dashboard_img = Buffer.from(dashData.image_data, 'base64');
          }
      
          // Create the dashboard entity
          const newDash = this.dashboardsRepository.create({
            ...dashData,
            dashboard_img, // <- manually assign binary image data here
          });
      
          // Optional: delete image_data to keep the entity clean (not necessary if not persisted, but clean)
          delete (newDash as any).image_data;
      
          // Save the dashboard
          await this.dashboardsRepository.save(newDash);
      
          // Log the creation
          await this.log(
            "CREAR",
            "dashManager",
            `El usuario ${await this.getUserNameById(uid)} creó el dashboard ${dashData.nombre}`
          );
      
          return newDash;
        } catch (error) {
          console.error(error);
          throw new Error('Error creating dashboard');
        }
    }
      

    /**
     * Obtiene todos los dashboards de la tabla dashboards
     */
    async getAllDash(): Promise<any>{
        const allDashboards = await this.dashboardsRepository.find()
        return allDashboards
    }

    /**
     * 
     * @param pk Primary key del dashboard a borrar
     * @param requestUserId 
     */
    async delete(pk: number, uid: string): Promise<void>{
        const dashboard = await this.dashboardsRepository.findOneBy({pk})
        if(dashboard){
            console.log(dashboard)
            // Borra todas las relaciones dashboard-user
            await this.dashboardUserRepository.delete({key: pk})
            await this.dashboardsRepository.remove(dashboard)
            await this.log("BORRAR", "dashManager", `El usuario ${await this.getUserNameById(uid)} borro el dashboard ${dashboard.nombre}`)
        }
    }
    
    async deleteDashRelation(primaryKey: number, uid: string){
        const dashRelation = await this.dashboardUserRepository.findOne({where: {
            key: primaryKey
        }})
        console.log(dashRelation)
        if(dashRelation){
            this.dashboardUserRepository.remove(dashRelation)
            await this.log("BORRAR", "dashManager", `El usuario ${await this.getUserNameById(uid)} borro la relacion entre dashboard '${await this.getDashNameByPk(dashRelation.dashboard_pk)}' y el usuario '${await this.getUserNameById(dashRelation.user_id)}'`)
            return {success: true}
        }
    }

    async getDashNameByPk(pk: number){
        const dash = await this.dashboardsRepository.findOne({where: {pk: pk}})

        if(!dash) return

        return dash.nombre
    }

    /**
     * Obtiene todas las relaciones a usuarios que tiene un dashboard
     * @param pk Primary key del dashboard
     * @returns Todas las relaciones entre usuarios y ese dashboard
     */
    async getAllDashboardUsers(pk: number){
        const allDashboardUsers = await this.dashboardUserRepository.find({where:{dashboard_pk: pk}})
        return allDashboardUsers
    }

    /**
     * 
     * @returns Un arreglo con todos los usuarios
     */
    async allUsers(){
        const allUsrs = await this.userRep.find()
        return allUsrs
    }

    async getUserNameById(uid:string){
        const usr = await this.userRep.findOne({where:{ uuid: uid}})

        if (!usr) {
            // Handle the case where the user is not found
            throw new Error('User not found');
        }
    
        // Concatenate the name fields
        const completeName = `${usr.name} ${usr.firstName} ${usr.secondName}`.trim();
        return completeName;
    }

    async createUserDashboard(userDashboard: any, uid: string){
        try{
            const data = {
                dashboard_pk: userDashboard.dash_pk,
                user_id: userDashboard.user_id,
                created_by: userDashboard.userLoggedUIID,
                active: true,
                created_at: new Date()
            }
            const newUserDashboard = this.dashboardUserRepository.create(data)
            await this.dashboardUserRepository.save(newUserDashboard);
            await this.log("CREAR", "dashManager", `El usuario ${await this.getUserNameById(uid)} creo la relacion entre dashboard ${newUserDashboard.dashboard_pk} y el usuario ${await this.getUserNameById(newUserDashboard.user_id)}`)
            return {success: true}
        }catch(error){

        }
    }

    async updateVisibility(key: number, newVisibility: any, uid: string){
        const dashRelation = await this.dashboardUserRepository.findOne({where:{
            key: key
        }})

        if(dashRelation){
            dashRelation.active = newVisibility.newVisibilityValue
            await this.dashboardUserRepository.save(dashRelation)
            await this.log("EDIT", "dashManager", `El usuario ${await this.getUserNameById(uid)} edito la visibilidad a ${newVisibility.newVisibilityValue} en la relacion entre dashboard ${dashRelation.dashboard_pk} y el usuario ${dashRelation.user_id}`)
            return {success: true}
        }
    }

    async editName(pk: number, newName: string, uid: string){
        try{

            const dash = await this.dashboardsRepository.findOne({where: {pk: pk}})
            
            if(!dash) throw new Error('No se encontro el dash')

            const prevName = dash.nombre
    
            dash.nombre = newName
    
            await this.dashboardsRepository.save(dash)
            await this.log("EDIT", "dashManager", `El usuario ${await this.getUserNameById(uid)} edito el nombre de ${prevName} a ${newName} en dashboard ${dash.pk}`)
            
            return {success: true}
        }catch(error){

        }
    }
    
    async editDep(pk: number, newDep: string, uid: string){
        try{
            
            const dash = await this.dashboardsRepository.findOne({where: {pk: pk}})
            
            if(!dash) throw new Error('No se encontro el dash')

            const prevDep = dash.dependencia
            
            dash.dependencia = newDep
            
            await this.dashboardsRepository.save(dash)
            await this.log("EDIT", "dashManager", `El usuario ${await this.getUserNameById(uid)} cambio la dependencia de ${prevDep} a ${newDep} en dashboard ${await this.getDashNameByPk(dash.pk)}`)
            
            return {success: true}
        }catch(error){
            
        }
    }

    async editUnidad(pk: number, newUnidad: string, uid: string){
        try{
            const dash = await this.dashboardsRepository.findOne({where: {pk: pk}})

            if(!dash) throw new Error('No se encontro el dash')

            const prevUnidad = dash.unidad_responsable

            dash.unidad_responsable = newUnidad

            await this.dashboardsRepository.save(dash)
            await this.log("EDIT", "dashManager", `El usuario ${await this.getUserNameById(uid)} cambio la unidad responsable de "${prevUnidad}" a "${newUnidad}" en dashboard ${await this.getDashNameByPk(dash.pk)}`)
            
            return {success: true}
        }catch(error){

        }
    }

    async editArea(pk: number, newArea: string, uid: string){
        try{
            const dash = await this.dashboardsRepository.findOne({where: {pk: pk}})

            if(!dash) throw new Error('No se encontro el dash')

            const prevArea = dash.area

            dash.area = newArea

            await this.dashboardsRepository.save(dash)
            await this.log("EDIT", "dashManager", `El usuario ${await this.getUserNameById(uid)} cambio el area responsable de "${prevArea}" a "${newArea}" en dashboard ${await this.getDashNameByPk(dash.pk)}`)

            return {success: true}
        }catch(error){

        }
    }
    
    async editLink(pk: number, newLink: string, uid: string){
        try{
            console.log(newLink)
            
            const dash = await this.dashboardsRepository.findOne({where: {pk: pk}})
            
            if(!dash) throw new Error('No se encontro el dash')

            const prevLink = dash.link_powerbi
            
            dash.link_powerbi = newLink
            
            await this.dashboardsRepository.save(dash)
            
            await this.log("EDIT", "dashManager", `El usuario ${await this.getUserNameById(uid)} cambio el link de ${prevLink} a ${newLink} en dashboard ${dash.pk}`)
            return {success: true}
        }catch(error){
            
        }
    }

    async editDesc(pk: number, newDesc: string, uid: string){
        try{
            const dash = await this.dashboardsRepository.findOne({where: {pk: pk}})

            if(!dash) throw new Error('No se encontro el dash')

            const prevDesc = dash.descripcion

            dash.descripcion = newDesc

            await this.dashboardsRepository.save(dash)
            await this.log("EDIT", "dashManager", `El usuario ${await this.getUserNameById(uid)} cambio la descripcion de "${prevDesc}" a "${newDesc}" en dashboard ${dash.pk}`)

            return {success: true}
        }catch(error){

        }
    }

    async editImgDash(pk: number, imgData: any){
        if(!pk) return 
        console.log(pk)
        const fetchedDash = await this.dashboardsRepository.findOne({where: {pk: pk}})

        if(!fetchedDash) throw new HttpException('No se encontro el dashboard', HttpStatus.CONFLICT)

        // Convert base64 image to Buffer
        let dashboard_img: Buffer | null = null;
        if (imgData.newImg) {
          dashboard_img = Buffer.from(imgData.newImg, 'base64');
        }
        
        fetchedDash.dashboard_img = dashboard_img
        await this.dashboardsRepository.save(fetchedDash)
        return {success: true}
    }
    
    async createOrg(createPayload: any, uid: string){
        try{
            const org = await this.orgReposiotry.findOne({where: {
                nombre: createPayload.nombre
            }}) 
            
            if(org){
                throw new Error('La Organizacion ya existe')
            }else{
                const newOrg = this.orgReposiotry.create({
                    ...createPayload, created_at: new Date()
                })
                
                await this.orgReposiotry.save(newOrg)
                await this.log("CREAR", "dashManager", `El usuario ${await this.getUserNameById(uid)} creo la organizacion ${createPayload.nombre}`)
                return {success: true}
            }
        }catch(error){
            throw new Error(error.message)
        }
    }

    async editOrgName(pk: number, newValOrg: string, uid: string){
        try{
            const org = await this.orgReposiotry.findOne({where: {
                pk: pk
            }})

            if(!org) throw new Error('No existe Organizacion')

            const prevName = org.nombre

            org.nombre = newValOrg

            await this.orgReposiotry.save(org)
            await this.log("EDIT", "dashManager", `El usuario ${await this.getUserNameById(uid)} cambio al organizacion '${prevName}' a '${newValOrg}'`)

            return {success: true}
        }catch(error){

        }
    }
    
    async getAllOrgs(){
        try {
            const orgs = await this.orgReposiotry.find({
                order: {
                    created_at: "DESC"
                }
            });
            return orgs;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
    
    async deleteOrg(pk: number, uid: string){
        try{
            const org = await this.orgReposiotry.findOne({where: {pk: pk}})
    
            if(!org) throw new Error('No existe la organizacion')
    
            this.orgReposiotry.remove(org)
            
            await this.log("BORRAR", "dashManager", `El usuario ${await this.getUserNameById(uid)} borro la organizacion ${org.nombre}`)
            return {success: true}
        }catch(error){
            throw new Error(error.message)
        }
    }

    async getAllLogs({page  = 1, limit = 100}): Promise<{ logs: Log[], total: number }> {
        const offset = (page - 1) * limit;
    
        // Adjusting for ORM syntax; for example, TypeORM
        const [logs, total] = await this.logger.findAndCount({
            where: {
                context: Not('NoContext')
            },
            order: {
                createdAt: 'DESC' 
            },
            skip: offset,
            take: limit
        });
        
        return { logs, total};
    }

    async getDependencias(){
        const fileContents = fs.readFileSync('./src/assets/dependencias/dependencias_old_202402261303.csv', 'utf8');
        const rows = fileContents.split('\n');

        // Assuming the first row contains column headers
        let headers = rows[0].split(',');
        headers = headers.map(header => header.replace(/"/g, ''));

        const data = [];
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i].split(',');
            const rowData = {};

            for (let j = 0; j < headers.length; j++) {
                const value = row[j] !== undefined ? row[j].replace(/"/g, '') : null;
                // Only assign value if it's not undefined
                if (value !== undefined) {
                    rowData[headers[j]] = value;
                }
            }

            data.push(rowData);
        }

        return data;
    }

    async getUnidadesResponsable(){
        const fileContents = fs.readFileSync('./src/assets/unidades/ur_old.csv', 'utf8')
        const rows = fileContents.split('\n');

        // Assuming the first row contains column headers
        let headers = rows[0].split(',');
        headers = headers.map(header => header.replace(/"/g, ''));

        const data = [];
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i].split(',');
            const rowData = {};

            for (let j = 0; j < headers.length; j++) {
                const value = row[j] !== undefined ? row[j].replace(/"/g, '') : null;
                // Only assign value if it's not undefined
                if (value !== undefined) {
                    rowData[headers[j]] = value;
                }
            }

            data.push(rowData);
        }

        return data;
    }
}
