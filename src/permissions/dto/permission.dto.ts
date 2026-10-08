import { Exclude, Expose } from 'class-transformer';
import { GroupDto } from '../../groups/dto/group.dto';

@Exclude()
export class PermissionDto {
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
	group: GroupDto;
	constructor(data: Partial<PermissionDto> = {}){
		Object.assign(this, data)
		if (data.group) {
			this.group = new GroupDto(data.group)
		}
	}
}
