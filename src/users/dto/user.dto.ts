import { Exclude, Expose, Transform } from 'class-transformer';
import { PermissionDto } from '../../permissions/dto/permission.dto';
import { RoleDto } from '../../roles/dto/role.dto';
import { User } from '../../entities/usr/user.entity';
import { RoleUser } from '../../entities';


export class UserResponseDTO extends User {
	@Exclude()
	id: number;
	@Exclude()
	password: string;
	@Exclude()
	hashedRT: string;
	@Exclude()
	roleUsers: RoleUser[];
	@Expose()
	@Transform(({ obj: { roleUsers } }) => roleUsers.filter((i) => i.role).map((i) => ({ id: i.role.id, name: i.role.name })))
	roles: { id: number, role: string }[];
}

