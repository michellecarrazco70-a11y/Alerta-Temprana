import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { GetCurrentUserId, Permissions } from '../common/decorators/commons.decorator';
import { FindCommonsFiltersDTO, PaginationResponseDTO } from '../common/dtos/page-options.dto';
import { TypePermissions } from '../common/enums/access.enum';
import { CreateRoleDto } from './dto/create-role.dto';
import { PermissionRolesDto } from './dto/permission-roles.dto';
import { RoleDto } from './dto/role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolesService } from './roles.service';


@Controller('roles')
@Permissions(TypePermissions.ROLES_MODULE)
export class RolesController {
	constructor(private readonly rolesService: RolesService) { }

	@Post()
	async create(@Body() createRoleDto: CreateRoleDto, @GetCurrentUserId() userId: number,): Promise<RoleDto> {
		const role = await this.rolesService.create(createRoleDto, userId);
		return new RoleDto(role)
	}

	@Get()
	async findAll(@Query() pageOptionsDto: FindCommonsFiltersDTO): Promise<PaginationResponseDTO<RoleDto>> {
		const roleFiltered = await this.rolesService.findAll(pageOptionsDto);
		return new PaginationResponseDTO({
			total: roleFiltered.total,
			data: roleFiltered.data.map((i) => new RoleDto(i)),
			skip: pageOptionsDto.skip,
			take: pageOptionsDto.take
		})
	}

	@Get(':id')
	findOne(@Param('id', ParseIntPipe) id: number): Promise<RoleDto> {
		return this.rolesService.findOne(id);
	}

	@Patch(':id/editar')
	@HttpCode(HttpStatus.NO_CONTENT)
	update(@Param('id', ParseIntPipe) id: number, @Body() updateRoleDto: UpdateRoleDto, @GetCurrentUserId() userId: number): Promise<void> {
		return this.rolesService.update(id, updateRoleDto, userId);
	}

	@Patch(':id/desactivar')
	@HttpCode(HttpStatus.NO_CONTENT)
	deactivate(@Param('id', ParseIntPipe) id: number, @GetCurrentUserId() userId: number): Promise<void> {
		return this.rolesService.toggleActive(false, id, userId);
	}

	@Patch(':id/activar')
	@HttpCode(HttpStatus.NO_CONTENT)
	activate(@Param('id', ParseIntPipe) id: number, @GetCurrentUserId() userId: number): Promise<void> {
		return this.rolesService.toggleActive(true, id, userId);
	}

	@Delete(':id/eliminar')
	@HttpCode(HttpStatus.NO_CONTENT)
	delete(@Param('id', ParseIntPipe) id: number, @GetCurrentUserId() userId: number): Promise<void> {
		return this.rolesService.softDelete(id, userId);
	}

	@Post(':id/permisos')
	@Permissions(TypePermissions.PERMISSONS_MODULE)
	renovatePermissionsToRole(@Param('id', ParseIntPipe) id: number, @Body() permissionRoleDto: PermissionRolesDto, @GetCurrentUserId() userId: number,): Promise<void> {
		return this.rolesService.setPermissions(id, permissionRoleDto, userId);
	}
}
