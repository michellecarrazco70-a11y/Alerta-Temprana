import { PartialType } from "@nestjs/mapped-types";
import { CreateBibliotecaEpidemiologicaDto } from "./create-biblioteca-epidemiologica.dto";

export class UpdateBibliotecaEpidemiologicaDto extends PartialType
(CreateBibliotecaEpidemiologicaDto){}
//Podremos agregar que se quite el archivo sin subir otro
//Noto: actualmente si borramos un archivo no se permite actualizar o registrar patologia.