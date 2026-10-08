import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Not, Repository } from 'typeorm';
import { ERRORS } from '../common/constants/errors.const';
import { FindCommonsFiltersDTO } from '../common/dtos/page-options.dto';
import { LOG_ACTIONS } from '../common/enums/log-movements.enum';
import { PermissionRole, Role } from '../entities';
import { PermissionDto } from '../permissions/dto/permission.dto';
import { LoggerService } from '../system-logs/logs.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { PermissionRolesDto } from './dto/permission-roles.dto';
import { RoleDto } from './dto/role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
	constructor(
		@InjectRepository(Role)
		private roleRepository: Repository<Role>,
		@InjectRepository(PermissionRole)
		private permissionRoleRepository: Repository<PermissionRole>,
		private logger: LoggerService,
	) {
		logger.setContext(RolesService.name)
	}

	async create(createRoleDto: CreateRoleDto, requestUserId: number): Promise<Role> {
		const role = this.roleRepository.create({
			...createRoleDto,
			createdBy: requestUserId,
			order: 0,
			isActive: true
		});
		console.log(role)
		await this.roleRepository.save(role);

		await this.logger.log(null, requestUserId, LOG_ACTIONS.NEW_REGISTER, { registeredId: role.id })
		return role;
	}

	async findAll(pageOptionsDto: FindCommonsFiltersDTO): Promise<{ data: Role[]; total: number; }> {
		let where: FindOptionsWhere<Role> = {};
		if (pageOptionsDto.id) {
			where.id = pageOptionsDto.id;
		}
		const [data, total] = await this.roleRepository.findAndCount({
			where,
			take: pageOptionsDto.take,
			skip: pageOptionsDto.skip,
		},);
		return { data, total }
	}

	async findOne(id: number): Promise<RoleDto> {
		const role = await this.roleRepository.findOne({ where: { id } });

		if (!role) {
			throw new HttpException(ERRORS.Roles_Errors.ERR008, HttpStatus.NOT_FOUND);
		}

		const permissionsDto = await this.getPermissionsRole(role.id);
		const roleDto = new RoleDto({
			...role,
			permissions: permissionsDto
		});
		return roleDto;
	}

	async update(id: number, updateRoleDto: UpdateRoleDto, requestUserId: number,): Promise<void> {
		const exists = await this.roleRepository.findOne({
			where: {
				id: Not(id),
				name: ILike(updateRoleDto.name)
			}
		});
		if (exists) {
			throw new HttpException(ERRORS.ERR0P01, HttpStatus.BAD_REQUEST);
		}
		const role = await this.roleRepository.findOneBy({ id })
		if (role) {
			const oldName = role.name
			role.name = updateRoleDto.name
			role.route = updateRoleDto.route
			role.desc = updateRoleDto.desc
			await this.roleRepository.save(role)

			await this.logger.log(null, requestUserId, LOG_ACTIONS.EDIT, { updatedId: id, name: oldName })
		}
	}
	async toggleActive(active: boolean, id: number, requestUserId: number): Promise<void> {
		await this.roleRepository.update({ id }, { isActive: active })
		await this.logger.log(null, requestUserId, LOG_ACTIONS.TOGGLE_ACTIVE, { id, active })
	}
	async softDelete(id: number, requestUserId: number): Promise<void> {
		await this.roleRepository.softDelete({ id })
		await this.logger.log(null, requestUserId, LOG_ACTIONS.DELETE, { id })
	}
	async setPermissions(id: number, permissionRoleDto: PermissionRolesDto, userId: number,): Promise<void> {
		const role = await this.roleRepository.findOneBy({
			id,
			isActive: true,
		});

		if (!role) {
			throw new HttpException(ERRORS.Roles_Errors.ERR008, HttpStatus.NOT_FOUND);
		}
		const oldPermission = await this.getPermissionsRole(id);

		const permissionRoleList = permissionRoleDto.permissionIds.map((i) =>
			this.permissionRoleRepository.create({ roleId: id, permissionId: i })
		)
		await this.permissionRoleRepository.delete({ roleId: id })
		await this.permissionRoleRepository.save(permissionRoleList)

		await this.logger.log(null, userId, LOG_ACTIONS.SET_PERMISSIONS_TO_ROLE, {
			roleId: id,
			permissionsIds: oldPermission.map((i) => i.id)
		})
	}
	async getPermissionsRole(roleId: number): Promise<PermissionDto[]> {
		const permissionRoles = await this.permissionRoleRepository.find({
			where: {
				roleId: roleId,
			},
			relations: { permission: true },
		});
		return permissionRoles.map((i) => new PermissionDto(i.permission))
	}
}
