import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Query, } from '@nestjs/common';
import { GetCurrentUserId, Permissions } from '../common/decorators/commons.decorator';
import { FindCommonsFiltersDTO, PaginationResponseDTO } from '../common/dtos/page-options.dto';
import { TypePermissions } from '../common/enums/access.enum';
import { Permission } from '../entities';
import { PermissionDto } from './dto/permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { PermissionsService } from './permissions.service';

@Controller('permisos')
@Permissions(TypePermissions.PERMISSONS_MODULE)
export class PermissionsController {
	constructor(private readonly permissionsService: PermissionsService) { }

	@Get()
	async findAll(@Query() pageOptionsDto: FindCommonsFiltersDTO): Promise<PaginationResponseDTO<PermissionDto>> {
		const filtered = await this.permissionsService.findAll(pageOptionsDto);
		return new PaginationResponseDTO({
			total: filtered.total,
			data: filtered.data.map((i) => new PermissionDto(i)),
			skip: pageOptionsDto.skip,
			take: pageOptionsDto.take
		})
	}

	@Get(':id')
	findOne(@Param('id', ParseIntPipe) id: number): Promise<Permission> {
		return this.permissionsService.findOne(id);
	}

	@Patch(':id/editar')
	@HttpCode(HttpStatus.NO_CONTENT)
	update(@Param('id', ParseIntPipe) id: number, @Body() updatePermissionDto: UpdatePermissionDto, @GetCurrentUserId() userId: number): Promise<void> {
		return this.permissionsService.update(id, updatePermissionDto, userId);
	}

	@Patch(':id/desactivar')
	@HttpCode(HttpStatus.NO_CONTENT)
	remove(@Param('id', ParseIntPipe) id: number, @GetCurrentUserId() userId: number,): Promise<void> {
		return this.permissionsService.toggleActive(false, id, userId);
	}

	@Patch(':id/activar')
	@HttpCode(HttpStatus.NO_CONTENT)
	active(@Param('id', ParseIntPipe) id: number, @GetCurrentUserId() userId: number,): Promise<void> {
		return this.permissionsService.toggleActive(true, id, userId);
	}
}
