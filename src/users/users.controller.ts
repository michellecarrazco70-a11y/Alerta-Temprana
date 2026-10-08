import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common/enums';
import { GetCurrentUserId, GetCurrentUserUid, Permissions } from '../common/decorators/commons.decorator';
import { FindUsersFiltersDTO, PaginationResponseDTO } from '../common/dtos/page-options.dto';
import { TypePermissions } from '../common/enums/access.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDTO } from './dto/user.dto';
import { UsersService } from './users.service';

@Controller('usuarios')
@Permissions(TypePermissions.USERS_MODULE)
export class UsersController {
	constructor(
		private readonly usersService: UsersService,
	) { }

	@Post()
	async create(@Body() createUserDto: CreateUserDto, @GetCurrentUserId() userId: number,): Promise<UserResponseDTO> {
		const user = await this.usersService.create(createUserDto, userId);

		return new UserResponseDTO(user);
	}

	@Get()
	async findAll(@Query() pageOptionsDto: FindUsersFiltersDTO): Promise<PaginationResponseDTO<UserResponseDTO>> {
		const userFiltered = await this.usersService.findAll(pageOptionsDto);
		return new PaginationResponseDTO({
			total: userFiltered.total,
			data: userFiltered.data.map((i) => new UserResponseDTO(i)),
			skip: pageOptionsDto.skip,
			take: pageOptionsDto.take
		})
	}

	@Get(':uuid')
	async findOne(@Param('uuid') uuid: string): Promise<UserResponseDTO> {
		const user = await this.usersService.findOne(uuid);
		return new UserResponseDTO(user)
	}

	@Patch(':uuid/editar')
	@HttpCode(HttpStatus.NO_CONTENT)
	update(@Param('uuid') uuid: string, @Body() updateUserDto: UpdateUserDto, @GetCurrentUserId() userId: number,): Promise<void> {
		return this.usersService.update(uuid, updateUserDto, userId);
	}

	@Delete(':uuid/eliminar')
	@HttpCode(HttpStatus.NO_CONTENT)
	remove(@Param('uuid') uuid: string, @GetCurrentUserUid() userActionID: string,): Promise<void> {
		return this.usersService.deleteUser(uuid, userActionID);
	}

	@Patch(':uuid/activar')
	@HttpCode(HttpStatus.NO_CONTENT)
	active(@Param('uuid') uuid: string, @GetCurrentUserId() userId: number,): Promise<void> {
		return this.usersService.toggleActive(true, uuid, userId);
	}

}



