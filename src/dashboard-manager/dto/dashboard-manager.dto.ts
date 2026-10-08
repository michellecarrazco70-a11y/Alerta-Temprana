import { Exclude, Expose } from 'class-transformer';
import { PermissionDto } from '../../permissions/dto/permission.dto';
import { UtilsService } from '../../utils.service';
import { IsBoolean, IsDate, IsNumber, IsOptional, IsString } from 'class-validator';

@Exclude()
export class DahboardManagerDto {

    @IsOptional()
    pk: number

    @Expose()
    @IsString()
    nombre: string;

    @Expose()
    @IsString()
    descripcion: string;

    @Expose()
    @IsBoolean()
    is_active: boolean;

    @Expose()
    @IsString()
    dependencia: string;

    @Expose()
    @IsString()
    area: string;

    @Expose()
    @IsString()
    unidad_responsable: string;

    @Expose()
    @IsString()
    link_powerbi: string;

    @IsOptional()
    @IsDate()
    created_at: Date;

    @IsOptional()
    @IsDate()
    updated_at: Date;

    @Expose()
    @IsOptional()
    permissions?: PermissionDto[];

    @Expose()
    @IsOptional()
    @IsString()
    image_data?: string;
    
    
	constructor(data: Partial<DahboardManagerDto> = {}) {
		Object.assign(this, data)
		if (!UtilsService.isNoE(data.permissions)) {
			this.permissions = data.permissions.map((i) => new PermissionDto(i))
		}
	}
}
