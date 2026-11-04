import { IsDateString, IsIn, IsUUID, Matches } from 'class-validator';
import { VIAS_ENTREVISTA, ViaEntrevista } from '../../entities/usr/adr-entrevista.entity';

export class CreateEntrevistaDto {

    @IsUUID()
    temaUuid: string;

    @IsUUID()
    voceriaUuid: string;

    @IsUUID()
    medioUuid: string;

    @IsDateString()
    @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'fecha debe tener formato YYYY-MM-DD' })
    fecha: string;

    @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'hora debe tener formato HH:mm' })
    hora: string;

    @IsIn(VIAS_ENTREVISTA)
    via: ViaEntrevista;
}