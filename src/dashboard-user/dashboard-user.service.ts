import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GetCurrentUserUid } from 'src/common/decorators/commons.decorator';
import { Log, User } from 'src/entities'
import { Repository } from 'typeorm';


@Injectable()
export class DashboardUserService {

    constructor(
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
        // const userDashboards = await this.dashboardUserRepository.find({where:{
        //     user_id: uid,
        //     active: true
        // }})
        // return userDashboards
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
