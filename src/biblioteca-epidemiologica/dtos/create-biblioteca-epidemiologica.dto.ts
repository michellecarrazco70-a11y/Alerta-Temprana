import { plainToInstance, Transform, Type } from "class-transformer";
import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray,
    IsDateString,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    Matches,
    Max,
    MaxLength,
    Min,
    ValidateNested

} from "class-validator";

export class InformeDto {
    //nombre libre
    //Cuando ponemos el nombre de forma libre (opcion: Otro) el servicio lo estandariza contra las patologias
    //ya registradas (no distingue mayusculas de minusculas).

    @Transform(({ value }) =>
        typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : value
    )
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    patologia: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    archivoIndex?: number | null;
}

// en multipart/form-dala "informes" llegan como texto JSON.
const parseInformes = ({ value }: { value: unknown }) => {
    let raw = value;

    if (typeof value === 'string') {
        try {
            raw = JSON.parse(value);
        } catch {
            return value;
        }
    }

    return Array.isArray(raw) ? plainToInstance(InformeDto, raw) : raw;
};

export class CreateBibliotecaEpidemiologicaDto {

    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(53)
    numeroSemana: number;

    @IsDateString()
    @Matches(/^\d{4}-\d{2}-\d{2}$/)
    inicioSemana: string;

    @IsDateString()
    @Matches(/^\d{4}-\d{2}-\d{2}$/)
    finSemana: string;

    @Transform(parseInformes)
    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(10)
    @ValidateNested({ each: true })
    informes: InformeDto[];
}
