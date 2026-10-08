import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { FindGroupsFiltersDTO, PaginationResponseDTO } from '../common/dtos/page-options.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { GroupDto } from './dto/group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupsService } from './groups.service';
import { GetCurrentUserId, Permissions } from '../common/decorators/commons.decorator';
import { TypePermissions } from '../common/enums/access.enum';

@Controller('grupos')
@Permissions(TypePermissions.GROUPS_MODULE)
export class GroupsController {
	constructor(private readonly groupsService: GroupsService) { }

	@Post()
	async create(@Body() createGroupDto: CreateGroupDto, @GetCurrentUserId() userId: number,): Promise<GroupDto> {
		const group = await this.groupsService.create(createGroupDto, userId);
		return new GroupDto(group)
	}

	@Get()
	async findAll(@Query() pageOptionsDto: FindGroupsFiltersDTO): Promise<PaginationResponseDTO<GroupDto>> {
		const roleFiltered = await this.groupsService.findAll(pageOptionsDto);
		return new PaginationResponseDTO({
			total: roleFiltered.total,
			data: roleFiltered.data.map((i) => new GroupDto(i)),
			skip: pageOptionsDto.skip,
			take: pageOptionsDto.take
		})
	}
	@Get(':id')
	async findOne(@Param('id', ParseIntPipe) id: number): Promise<GroupDto> {
		const group = await this.groupsService.findOne(id);
		return new GroupDto(group)
	}

	@Patch(':id/editar')
	update(@Param('id', ParseIntPipe) id: number, @Body() updateGroupDto: UpdateGroupDto, @GetCurrentUserId() userId: number,): Promise<void> {
		return this.groupsService.update(id, updateGroupDto, userId);
	}

	@Patch(':id/activar')
	activate(@Param('id', ParseIntPipe) id: number, @GetCurrentUserId() userId: number,): Promise<void> {
		return this.groupsService.toggleActive(true, id, userId);
	}
	@Patch(':id/desactivar')
	deactivate(@Param('id', ParseIntPipe) id: number, @GetCurrentUserId() userId: number,): Promise<void> {
		return this.groupsService.toggleActive(false, id, userId);
	}
	@Delete(':id/eliminar')
	delete(@Param('id', ParseIntPipe) id: number, @GetCurrentUserId() userId: number,): Promise<void> {
		return this.groupsService.delete(id, userId);
	}
}
