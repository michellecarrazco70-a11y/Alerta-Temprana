import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Features } from 'src/entities/usr/red_troncal_features.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AccesosPublicosService {

    constructor(
        @InjectRepository(Features)
        private featuresRepository: Repository<Features>,
    ){}

    readonly grupoFeatures = 'Internet Gratuito'

    async getAllAccesos(){
        const fetchFeatures = await this.featuresRepository.find({where: {activo: true, grupo: this.grupoFeatures}})

        if(!fetchFeatures) return []

        return fetchFeatures
    }
}
