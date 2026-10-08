import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {    Dashboard, 
            Log, 
            User, 
            dashboard_user, 
            organizaciones,
            RoleUser,
            proyectos,
            userProyects,
            Avances
        } from 'src/entities';
import { IsNull, Not, Repository } from 'typeorm';
import { addDashboard } from './dto/add-dashboard.dto';
import { DahboardManagerDto } from './dto/dashboard-manager.dto';
import * as fs from 'fs'
import { DashboardManagerService } from './dashboard-manager.service';

@Injectable()
export class ProyectosService {
    constructor(
        @InjectRepository(proyectos)
        private proyectRepository: Repository<proyectos>,
        @InjectRepository(RoleUser)
        private roleUserRepository: Repository<RoleUser>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(userProyects)
        private userProyRepository: Repository<userProyects>,
        @InjectRepository(Avances)
        private avancesRepository: Repository<Avances>,
        @InjectRepository(Log)
        private logger: Repository<Log>,
        private dashService: DashboardManagerService
    ){

    }

    async log(action: string, message: string, stack: string){
        const newLog = this.logger.create({
            action: action,
            context: 'Proyectos',
            message: message,
            stack: stack
        })
        await this.logger.save(newLog)
    }

    async getUserNameByUid(uid:string){
        const usr = await this.userRepository.findOne({where:{ uuid: uid}})

        if (!usr) {
            // Handle the case where the user is not found
            throw new Error('User not found');
        }
    
        // Concatenate the name fields
        const completeName = `${usr.name} ${usr.firstName} ${usr.secondName}`.trim();
        return completeName;
    }

    async createProyecto(newProyectData: any, uid: string){
        if(!newProyectData.area_resp || 
            !newProyectData.proyecto || 
            !newProyectData.nombre_proy ||
            !newProyectData.fecha_solicitud) throw new Error('Viene mal el formulario')
        try{
            const userNameAction = await this.getUserNameByUid(uid)

            const fecha_inicio = newProyectData.fecha_inicio ? new Date(newProyectData.fecha_inicio) : null
            const fecha_solicitud = newProyectData.fecha_solicitud ? new Date(newProyectData.fecha_solicitud) : null
            const fecha_finalizacion = newProyectData.fecha_finalizacion ? new Date(newProyectData.fecha_finalizacion) : null

            const data = {
                ...newProyectData,
                responsable: userNameAction,
                fecha_inicio: fecha_inicio,
                fecha_solicitud: fecha_solicitud,
                fecha_liberacion: null,
                fecha_finalizacion: fecha_finalizacion,
                comentarios: '',
                estatus: null,
                avance: null,
                visible: true,
                uuid: uid
            }
    
            await this.proyectRepository.save(data)
            this.log('CREAR', ``, `${uid}`)

            return {success: true}
        }catch(error){

        }
    }

    async createProyectoPadre(newProyectData: any, uid: string){
        if(!newProyectData.proyecto || 
            !newProyectData.nombre_proy ||
            !newProyectData.fecha_solicitud) throw new Error('Viene mal el formulario')
        try{
            // Checa si ya existe un proyecto con ese nombre
            const checkRes = await this.proyectRepository.findOne({where: {proyecto: newProyectData.proyecto}})
        
            if(checkRes) return {worng: true, msj: "Ya existe un Proyecto con ese Nombre, intenta con uno distinto"}

            const userNameAction = await this.getUserNameByUid(uid)

            let usersToAdd = [...newProyectData.usersToAdd]


            delete newProyectData.usersToAdd


            const fecha_inicio = newProyectData.fecha_inicio ? new Date(newProyectData.fecha_inicio) : null
            const fecha_solicitud = newProyectData.fecha_solicitud ? new Date(newProyectData.fecha_solicitud) : null
            const fecha_finalizacion = newProyectData.fecha_finalizacion ? new Date(newProyectData.fecha_finalizacion) : null

            const ud_admva = newProyectData.unidadObj.ud_admva
            const cg_clave = newProyectData.unidadObj.cg_clave

            const dependencia = newProyectData.depObj.dependencia
            const dep_clave = newProyectData.depObj.dep_clave

            delete newProyectData.unidadObj 
            delete newProyectData.depObj 

            const data = {
                ...newProyectData,
                responsable: userNameAction,
                fecha_inicio: fecha_inicio,
                fecha_solicitud: fecha_solicitud,
                escolaborado: true,
                fecha_liberacion: null,
                fecha_finalizacion: fecha_finalizacion,
                comentarios: '',
                estatus: null,
                avance: null,
                uuid: uid,
                dependencia,
                visible: true,
                dep_clave,
                ud_admva,
                cg_clave
            }
            const createProyRes = await this.proyectRepository.save(data)
            // this.log('CREAR', 'Proyectos', ``, `${uid}`)
            for(let user of usersToAdd){
                try{
                    const relationData = {
                        proy_id: createProyRes.proy_id,
                        proyecto: user.proyecto,
                        area_resp: user.area,
                        uid: user.uid,
                        nombre: user.nombre,
                        nombre_proy: user.nombre_proy,
                        fecha_inicio: null,
                        fecha_finalizacion: null,
                        fecha_liberacion: null,
                        comentario: null,
                        visible: true
                    }

                    const createRes = await this.userProyRepository.save(relationData)
                    
                }catch(error){}
            }

            return {success: true}
        }catch(error){

        }
    }

    async getProyectosRel(uid: string){
        const proyectos = await this.userProyRepository.find({where: {uid: uid, visible: true}})
        console.log(uid)
        console.log(proyectos)
        if(!proyectos) return []

        return proyectos
        let proyectosData = []

        for(let proyecto of proyectos){
            const proyectFetchedData = await this.proyectRepository.findOne({where:{proy_id: proyecto.proy_id}})
            proyectosData.push(proyectFetchedData)
        }

        return proyectosData
    }

    async getProyectos(uid: string ){
        const proyectos = await this.proyectRepository.find({where: {uuid: uid, visible: true}})
        if(!proyectos) return []

        return proyectos
    }

    async checkAccess(uid: number){
        const checkRes = await this.roleUserRepository.find({where: {userId: uid, roleId: 5}})
        return checkRes.length > 0; // Regresa True si existe la relacion
    }

    async getDependencias(){
        return await this.dashService.getDependencias()
    }

    async getUnidadesResponsables(){
        return await this.dashService.getUnidadesResponsable()
    }

    async patchProy(updateFields: any, proy_id: number, uid: string){
        try{
            const proyecto = await this.proyectRepository.findOne({where: {proy_id: proy_id, uuid: uid}})
            if(!proyecto) throw new Error('No se encontro el dash')
            console.log('====================================')
            if(updateFields.forLiberar) delete updateFields.forLiberar
            
            for (const key in updateFields) {
                if (updateFields.hasOwnProperty(key)) {
                    const value = updateFields[key];
                    
                    if (key === 'fecha_liberacion' || key === 'fecha_inicio' || key === 'fecha_finalizacion') {
                        proyecto[key] = new Date(value);
                    } else {
                        proyecto[key] = value;
                        console.log(key)
                        console.log(proyecto[key])
                    }
                }
            }
        
            
            const patchRes = await this.proyectRepository.save(proyecto);
            if(patchRes){
                this.log('EDIT', ``, `${proy_id}`)
                return {success: true}
            }
        }catch(error){}
    }

    async deleteProyecto(proy_id: number, mensaje: string, uid: string){
        try{
            const findRes = await this.proyectRepository.findOne({where: {proy_id: proy_id, uuid: uid}})
            const findSub = await this.userProyRepository.find({where: {proy_id: proy_id}})

            if(!findRes) throw Error('No se encontro el Proyecto')
            
            if(findSub.length){
                for(let proy of findSub){
                    await this.userProyRepository.remove(proy)
                }
            }

            const findComs = await this.avancesRepository.find({where: {proy_id: proy_id}})

            if(findComs.length){
                for(let avance of findComs){
                    await this.avancesRepository.remove(avance)
                }
            }

            const nombre_proy = findRes.nombre_proy
            findRes.visible = false
            const userNameAction = await this.getUserNameByUid(uid)

            const removeRes = await this.proyectRepository.save(findRes)
            if(removeRes){
                this.log('BORRAR',`El usuario ${userNameAction} borro el proyecto con nombre "${nombre_proy}" y dejo este mensaje: "${mensaje}" `,`${proy_id}`)
                return {success: true}
            }
        }catch(error){

        }
    }

    async getUsersDGSIF(uidAction: string){
        const DGSIF_Role = 5
        const rolesDGSIF = await this.roleUserRepository.find({where: {roleId: DGSIF_Role}})

        if(!rolesDGSIF.length) return []

        
        let usuarios: {uid: string, nombre: string, id: number}[] = []
        for(let usr of rolesDGSIF){
            const usrRes = await this.userRepository.findOne({where: {id: usr.userId}})
            
            if(!usrRes) continue
            const uid = usrRes.uuid
            usuarios.push({uid: uid, nombre: await this.getUserNameByUid(uid), id: usr.userId})
        }

        usuarios = usuarios.filter(u=>u.uid !== uidAction)
        return usuarios
    }

    async agregarAvance(uid: string, data: any){
        const relacionRes = await this.userProyRepository.findOne({where: {pk: data.pk}})
        
        if(!relacionRes) throw Error('No existe el proyecto')

        let updateFields = data.cambiosObj

        for (const key in updateFields) {
            if (updateFields.hasOwnProperty(key)) {
                const value = updateFields[key];
                
                if (key === 'fecha_liberacion' || key === 'fecha_inicio' || key === 'fecha_finalizacion') {
                    relacionRes[key] = new Date(value);
                } else if(key === 'avances'){
                    relacionRes[key] = parseInt(value)
                }else{
                    relacionRes[key] = value;
                }
            }
        }

        if(data.comentario){
            relacionRes['comentario'] = data.comentario
        }

        relacionRes.updated_at = new Date()

        const saveRes = await this.userProyRepository.save(relacionRes)
        
        console.log(saveRes)
        console.log(data)
        if(saveRes){
            const avanceAddObj = {
                uuid: uid,
                nombre: await this.getUserNameByUid(uid),
                comentario: data.comentario,
                msj: data.msj,
                proy_id: saveRes.proy_id,
                area_resp: saveRes.area_resp
            }
            const avanceRes = this.avancesRepository.create(avanceAddObj)
            const saveResAvance = await this.avancesRepository.save(avanceRes)
            if(saveResAvance){
                return {success: true}
            }
        }
        // console.log(relacionRes)
        // console.log(data)
    }

    async agregaAvancePersonal(data: any, uid: string){
        console.log(data)
        console.log(uid)
        let flag = false
        const dataObj = data.packagedData
        let proyFetchRes: any = await this.proyectRepository.findOne({where: { proy_id: dataObj.proy_id, uuid: uid}})

        if(!proyFetchRes){
            proyFetchRes = await this.userProyRepository.findOne({where: {proy_id:  dataObj.proy_id, uid: uid}})
            if(!proyFetchRes){
                throw Error('no se encontro proyecto')
            }
            flag = true
        }

        proyFetchRes.updated_at = new Date()

        let updateFields = dataObj.cambiosObj

        for (const key in updateFields) {
            if (updateFields.hasOwnProperty(key)) {
                const value = updateFields[key];
                
                if (key === 'fecha_liberacion' || key === 'fecha_inicio' || key === 'fecha_finalizacion') {
                    proyFetchRes[key] = new Date(value);
                } else if(key === 'avances'){
                    proyFetchRes[key] = parseInt(value)
                }else{
                    proyFetchRes[key] = value;
                }
            }
        }

        if(dataObj.comentario){
            proyFetchRes['comentario'] = dataObj.comentario
        }

        let saveRes
        if(!flag){
            saveRes = await this.proyectRepository.save(proyFetchRes)
        }else{
            saveRes = await this.userProyRepository.save(proyFetchRes)
        }

        if(saveRes){
            const avanceAddObj = {
                uuid: uid,
                nombre: await this.getUserNameByUid(uid),
                comentario: dataObj.comentario,
                msj: dataObj.msj,
                proy_id: saveRes.proy_id,
                area_resp: dataObj.area_resp
            }
            const avanceRes = this.avancesRepository.create(avanceAddObj)
            const saveResAvance = await this.avancesRepository.save(avanceRes)
            if(saveResAvance){
                return {success: true}
            }
        }
    }

    async getSubProy(requestObj: any, uid: string){
        const subProyId = requestObj.proy_id
        const area = requestObj.area
        console.log(requestObj)
        const subProyFetchRes = await this.userProyRepository.findOne({where: {proy_id: subProyId, area_resp: area, visible: true}})

        if(!subProyFetchRes) return

        console.log(subProyFetchRes)
        return subProyFetchRes
    }

    async getAvances(proy_id: number, uid: string){
        const fetchRes = await this.avancesRepository.find({where: {proy_id: proy_id}, order:{ created_at: "DESC"}})

        if(!fetchRes.length) return []

        return fetchRes
    }

    async getComentarios(proy_id: number, area: string){
        const avancesRes = await this.avancesRepository.find({where: {proy_id: proy_id, area_resp: area}, order: {created_at:"DESC"}})

        if(!avancesRes.length) return []

        let formatedArr = []

        for(let avance of avancesRes){
            formatedArr.push({comentario: avance.comentario, created_at: new Date(avance.created_at)})
        }

        return formatedArr
    }

    async editSubProy(pk: number, changeFields: any){
        const subProyRes = await this.userProyRepository.findOne({where: {pk: pk}})

        if(!subProyRes) throw Error('No se encontro el subproyecto')

        
    }

    async editNameSubProy(pk: number, newName: string){
        const subProyRes = await this.userProyRepository.findOne({where: {pk: pk}})

        if(!subProyRes) throw Error('No se encontro el subproyecto')

        subProyRes.nombre_proy = newName

        await this.userProyRepository.save(subProyRes)
        
        return {success: true}
    }

    async deleteSubProy(pk: number){
        const fetchedProy = await this.userProyRepository.findOne({where: { pk: pk }})

        if(!fetchedProy) throw Error('No se encontro el proyecto')

        const areaToRemove = fetchedProy.area_resp
        const proy_id = fetchedProy.proy_id

        fetchedProy.visible = false
        fetchedProy.deleted_at = new Date()

        const usersaveRes = await this.userProyRepository.save(fetchedProy)

        if(usersaveRes){
            const fetchedProyPadre = await this.proyectRepository.findOne({where: {proy_id: proy_id}})
            
            if(!fetchedProyPadre) return

            let areas = fetchedProyPadre.area_resp.split(', ')

            areas = areas.filter(area=> area != areaToRemove)

            fetchedProyPadre.area_resp = areas.join(', ')

            const changeAreaRes = await this.proyectRepository.save(fetchedProyPadre)
            if(changeAreaRes){
                return {success: true}
            }
        }

    }

    async asignUsrSubProy(asignObj: {uid: string, nombre: string, pk: number}){
        const subproy = await this.userProyRepository.findOne({where: {pk: asignObj.pk}})

        if(!subproy) throw Error('No se encontro el subproyecto')

        subproy.uid = asignObj.uid
        subproy.nombre = asignObj.nombre

        await this.userProyRepository.save(subproy)

        return {success: true}
    }

    async createSubProy(data: any){
        const proyPadre = await this.proyectRepository.findOne({where: {proy_id: data.proy_id}})

        let areas = proyPadre.area_resp.split(', ')

        areas.push(data.area_resp)

        if(!proyPadre) throw Error('No existe el proyecto padre')

        const packagedData = {
            ...data,
            visible: true,
        }

        console.log(packagedData)

        const createRes = await this.userProyRepository.save(packagedData)

        if(createRes){
            proyPadre.area_resp = areas.join(', ')
            const updatePadreRes = await this.proyectRepository.save(proyPadre)
            if(updatePadreRes) return {success: true}
        }
    }

    async getOneProy(proy_id: number){
        const proyRes = await this.proyectRepository.findOne({where: {proy_id: proy_id}})

        return proyRes        
    }
}