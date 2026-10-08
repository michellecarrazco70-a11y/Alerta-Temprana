import { Controller, Get } from '@nestjs/common';
import { AccesosPublicosService } from './accesos-publicos.service';
import { Public } from 'src/common/decorators/commons.decorator';

@Controller('accesos-publicos')
export class AccesosPublicosController {

    constructor(private readonly accesosPublicosService: AccesosPublicosService) {}

    @Public()
    @Get()
    getAccesosPublicos() {
        return this.accesosPublicosService.getAllAccesos();
    }
}
