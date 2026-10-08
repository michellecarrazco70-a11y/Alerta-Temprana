import { Exclude, Expose } from 'class-transformer';
import { PermissionDto } from '../../permissions/dto/permission.dto';
import { UtilsService } from '../../utils.service';

@Exclude()
export class RoleDto {
	@Expose()
	id: number;
	@Expose()
	name: string;
	@Expose()
	desc: string;
	@Expose()
	route: string;
	@Expose()
	isActive: boolean;
	@Expose()
	createdAt: Date;
	@Expose()
	permissions?: PermissionDto[];
	constructor(partial: Partial<RoleDto> = {}) {
		Object.assign(this, partial);
		if (!UtilsService.isNoE(partial.permissions)) {
			this.permissions = partial.permissions.map((i) => new PermissionDto(i))
		}
	}
}
