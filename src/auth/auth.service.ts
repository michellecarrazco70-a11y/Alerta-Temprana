import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { addMinutes, compareAsc } from 'date-fns';
import { ILike, Repository } from 'typeorm';
import { ERRORS } from '../common/constants/errors.const';
import { LOG_ACTIONS } from '../common/enums/log-movements.enum';
import { Tokens } from './interfaces/tokens.interface';
import { IMail } from '../common/interfaces/mail.interface';
import { MailProvider } from '../common/providers/mail.provider';
import { UserTokens } from '../entities/usr/user-tokens.entity';
import { User } from '../entities/usr/user.entity';
import { LoggerService } from '../system-logs/logs.service';
import { UsersService } from '../users/users.service';
import { AuthDto, RequestResetPasswordReqDTO } from './dtos/auth.dto';
import { LoginDto } from './dtos/login.dto';
import { Log } from 'src/entities';

@Injectable()
export class AuthService {

	constructor(
		private jwtTokenService: JwtService,
		@InjectRepository(User) private userRepository: Repository<User>,
		@InjectRepository(UserTokens) private userTokensRepository: Repository<UserTokens>,
		private _user: UsersService,
		private logger: LoggerService,
		@InjectRepository(Log)
        private loggerAux: Repository<Log>,
		private mailProvider: MailProvider,
	) {
		logger.setContext(AuthService.name)
	}

	async log(action: string, context: string, message: string, stack: string){
        const newLog = this.loggerAux.create({
            action: action,
            context: context,
            message: message,
            stack: stack
        })
        await this.loggerAux.save(newLog)
    }

	async getUserNameByUid(uid:string){
        const usr = await this.userRepository.findOne({where:{ uuid: uid}})

        if (!usr) {
            // Handle the case where the user is not found
            throw new Error('User not found');
        }
    
        // Concatenate the name fields
        const completeName = `${usr.name} ${usr.firstName} ${usr.secondName}`.trim();
        return completeName;
    }

	async signin(authDto: AuthDto, ip: string): Promise<LoginDto> {
		const user = await this.userRepository.findOne({
			where: {
				email: ILike(authDto.email),
				isActive: true,
			},
		});

		if (!user) {
			throw new HttpException(ERRORS.User_Errors.ERR002, HttpStatus.NOT_FOUND);
		}

		const passwordMatches = await bcrypt.compare(
			authDto.password,
			user.password,
		);

		if (!passwordMatches) {
			throw new HttpException(ERRORS.User_Errors.ERR003, HttpStatus.FORBIDDEN);
		}

		const tokens = await this.getToken(user.id, user.email);

		await this.updateRT(user.id, tokens.refreshToken);

		const userResponse = new LoginDto(user);
		// userResponse.roles = (await this._user.getUserRoles(user.id)).map((i) => i.id + '')
		userResponse.accessToken = tokens.accessToken;
		userResponse.refreshToken = tokens.refreshToken;
		userResponse.permissions = (await this._user.getUserPermission(user.id)).map((i) => ({ id: i.id, name: i.name }));
		userResponse.roles = (await this._user.getUserRoles(user.id) || []).map(
			(i) => i.name,
		);

		// await this.logger.log(null, user.id, LOG_ACTIONS.LOGIN, { ip });
		await this.log('INICIO DE SESIÓN', 'AuthService', `El usuario ${await this.getUserNameByUid(user.uuid)} inició sesión`,'')
		return userResponse;
	}
	
	async logout(userId: number, uid: string): Promise<boolean> {
		await this.userRepository.update({ id: userId}, { hashedRT: null })
		// await this.logger.log(null, userId, LOG_ACTIONS.LOGOUT)
		await this.log('CIERRE DE SESIÓN', 'AuthService', `El usuario ${await this.getUserNameByUid(uid)} cerró sesión`,'')
		return true;
	}

	async refreshToken(userId: number, rt: string) {
		const user = await this.userRepository.findOne({
			where: {
				id: userId,
				isActive: true,
			},
		});
		if (!user)
			throw new HttpException(ERRORS.User_Errors.ERR002, HttpStatus.NOT_FOUND);
		const rMatches = await bcrypt.compare(rt, user.hashedRT);
		if (!rMatches)
			throw new HttpException(ERRORS.User_Errors.ERR004, HttpStatus.FORBIDDEN);

		const tokens = await this.getToken(user.id, user.email);
		await this.updateRT(user.id, tokens.refreshToken);
		return tokens;
	}

	async hashData(refreshToken: string) {
		const salt = 10;
		return bcrypt.hash(refreshToken, salt);
	}

	async updateRT(userId: number, refreshToken: string): Promise<void> {
		const hash = await this.hashData(refreshToken);
		let user = await this.userRepository.findOne({
			where: {
				id: userId,
			},
		});
		if (!user)
			throw new HttpException(ERRORS.User_Errors.ERR002, HttpStatus.NOT_FOUND);
		user.hashedRT = hash;
		user = await this.userRepository.save(user);
	}

	async getToken(userId: number, email: string): Promise<Tokens> {
		const [at, rt] = await Promise.all([
			this.jwtTokenService.signAsync(
				{
					id: userId,
					email,
				},
				{
					secret: process.env.JWT_SECRET_KEY,
					expiresIn: process.env.JWT_EXPIRATION,
				},
			),
			this.jwtTokenService.signAsync(
				{
					id: userId,
					email,
				},
				{
					secret: process.env.RT_SECRET,
					expiresIn: process.env.RT_EXPIRATION,
				},
			),
		]);

		return {
			accessToken: at,
			refreshToken: rt,
		};
	}

	async requestResetPassword(data: RequestResetPasswordReqDTO) {
		const user: User = await this.userRepository.findOne({
			where: {
				email: data.email,
			}
		});
		if (!user) {
			throw new HttpException(ERRORS.User_Errors.ERR002, HttpStatus.NOT_FOUND);
		}
		const existingToken = await this.userTokensRepository.findOne({
			where: {
				typeToken: 'reset-password',
				userId: user.id
			}
		})
		if (existingToken) {
			await this.userTokensRepository.remove(existingToken)
		}

		const resetUUID = randomUUID();
		const hashResetToken = await this.hashData(resetUUID);

		const token = new UserTokens({
			userId: user.id,
			token: hashResetToken,
			typeToken: 'reset-password',
			expireOn: addMinutes(new Date(), 15)
		})
		await this.userTokensRepository.save(token)

		const message: IMail = {
			to: [user.email],
			from: process.env.SENGRID_FROM_EMAIL,
			template: { type: 'reset-password', token: hashResetToken, username: user.name },
		};
		await this.mailProvider.sendMail(message);

		await this.logger.log(null, user.id, LOG_ACTIONS.CHANGE_PASSWORD_REQUEST, { email: data.email, token: hashResetToken })
	}
	async resetPassword(password: string, token: string) {
		const ut = await this.userTokensRepository.findOneBy({ token, typeToken: 'reset-password' })
		// const ut = await UserTokens.findOneBy({ token, typeToken: 'reset-password' })
		if (!ut) {
			// throw new HttpException('No token found', 400)
			return
		}
		if (compareAsc(new Date(), ut.expireOn) === 1) {
			await this.userTokensRepository.delete(ut.id)
			throw new HttpException('Se ha agotado el tiempo.', 400)
		}


		const user = await this.userRepository.findOneBy({ id: ut.userId });

		if (!user) throw new HttpException(ERRORS.User_Errors.ERR002, HttpStatus.NOT_FOUND);

		user.password = bcrypt.hashSync(password, 10);
		await this.userRepository.save(user);
		await this.userTokensRepository.delete(ut.id)

		await this.logger.log(null, user.id, LOG_ACTIONS.CHANGE_PASSWORD, { token, email: user.email })
	}
}
