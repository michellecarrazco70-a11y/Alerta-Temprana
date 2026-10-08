import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/usr/user.entity';
import { UserRequest } from '../../common/interfaces/user-request.model';
import { UnauthorizedException } from '@nestjs/common';

export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(
		@InjectRepository(User)
		private userRepository: Repository<User>) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: process.env.JWT_SECRET_KEY
		})
	}
	async validate(payload: any) {
		const user = await this.userRepository.findOne({
			where: {
				id: payload.id,
				isActive: true
			},
		});
		if (!user) {
			throw new UnauthorizedException()
		}
		return new UserRequest(user)
	}
}