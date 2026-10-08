import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Ip, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto, RequestResetPasswordReqDTO, resetPasswordReqDTO } from './dtos/auth.dto';
import { LoginDto } from './dtos/login.dto';
import { RefreshTokenGuard } from '../common/guards/refresh-token.guard';
import { GetCurrentUser, GetCurrentUserId, GetCurrentUserUid, Public } from '../common/decorators/commons.decorator';
import { UtilsService } from '../utils.service';

@Controller('auth')
export class AuthController {
	constructor(
		private authService: AuthService,
	) { }


	@Get('verificar-token')
	@HttpCode(HttpStatus.NO_CONTENT)
	async verifyToken(@GetCurrentUserId() userId: number) { }

	@Public()
	@Post('login')
	login(@Body() authDto: AuthDto, @Ip() ip: string): Promise<LoginDto> {
		return this.authService.signin(authDto, ip);
	}

	@Post('logout')
	@HttpCode(HttpStatus.NO_CONTENT)
	logout(@GetCurrentUserId() userId: number, @GetCurrentUserUid() uid: string) {
		try {
			this.authService.logout(userId, uid);
		} catch (error) { }
	}

	@UseGuards(RefreshTokenGuard)
	@Public() // uso este decorador para que no entre al guard que valida el token en el header y solo que valider con el RefreshTokenGuard
	@Post('refresh')
	refresh(
		@GetCurrentUserId() userId: number,
		@GetCurrentUser('refreshToken') refreshToken: string,
	) {
		return this.authService.refreshToken(userId, refreshToken);
	}

	@Post('request-reset-password')
	@HttpCode(HttpStatus.NO_CONTENT)
	@Public()
	async requestResetPassword(@Body() data: RequestResetPasswordReqDTO) {
		try {
			// No debe devolver ningun error para que no sea una vulnerabilidad
			await this.authService.requestResetPassword(data);
		} catch (error) { }
	}
	@Post('reset-password')
	@HttpCode(HttpStatus.NO_CONTENT)
	@Public()
	async resetPassword(@Body() data: resetPasswordReqDTO) {
		await this.authService.resetPassword(data.password, data.token);
	}
}
