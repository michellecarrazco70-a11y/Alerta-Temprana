import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm/dist/typeorm.module";
import { InformeEpidemiologico } from "src/entities/usr/adr-informe-epidemiologico.entity";
import { SemanaEpidemiologica } from "src/entities/usr/adr-semana-epidemiologica.entity";
import { BibliotecaEpidemiologicaController } from "./biblioteca-epidemiologica.controller";
import { BibliotecaEpidemiologicaService } from "./biblioteca-epidemiologica.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            SemanaEpidemiologica,
            InformeEpidemiologico
        ])
    ],
    controllers: [BibliotecaEpidemiologicaController],
    providers: [BibliotecaEpidemiologicaService],
    exports: [BibliotecaEpidemiologicaService]
})

export class BibliotecaEpidemiologicaModule {}