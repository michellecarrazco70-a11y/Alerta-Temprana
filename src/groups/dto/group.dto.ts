import { Exclude, Expose } from 'class-transformer';
import { PermissionDto } from '../../permissions/dto/permission.dto';
import { UtilsService } from '../../utils.service';

@Exclude()
export class GroupDto {
	@Expose()
	id: number;
	@Expose()
	name: string;
	@Expose()
	isActive: boolean;
	@Expose()
	order: number;
	@Expose()
	createdAt: Date;
	@Expose()
	permissions?: PermissionDto[];
	constructor(data: Partial<GroupDto> = {}) {
		Object.assign(this, data)
		if (!UtilsService.isNoE(data.permissions)) {
			this.permissions = data.permissions.map((i) => new PermissionDto(i))
		}
	}
}
