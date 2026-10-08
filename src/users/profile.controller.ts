import { Body, Controller, Get, HttpCode, HttpStatus, Patch } from '@nestjs/common';
import { GetCurrentUser, GetCurrentUserId } from '../common/decorators/commons.decorator';
import { EditProfileDto } from './dto/edit-profile.dto';
import { UsersService } from './users.service';
import { UserResponseDTO } from './dto/user.dto';

@Controller('perfil')
export class ProfileController {
	constructor(private _users: UsersService) { }
	@Get()
	async get(@GetCurrentUser('uuid') uuid: string): Promise<UserResponseDTO> {
		const user = await this._users.findOne(uuid)
		return new UserResponseDTO(user)
	}
	@Patch()
	@HttpCode(HttpStatus.NO_CONTENT)
	async update(@Body() editProfileDto: any, @GetCurrentUserId() userId: number): Promise<any> {
		const user = await this._users.editProfile(
			userId,
			editProfileDto,
			userId,
		);
		return user
	}
}