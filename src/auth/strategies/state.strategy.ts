import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// validacion del token para pantener un estado entre varias peticiones
// por ejemplo las peticiones del proceso de registro de empleado
@Injectable()
export class StateStrategy extends PassportStrategy(Strategy, 'jwt-state') {
	constructor(config: ConfigService) {
		super({
			jwtFromRequest: ExtractJwt.fromBodyField('token'),
			secretOrKey: config.get<string>('JWT_SECRET_KEY'),
			passReqToCallback: true,
		});
	}

	validate(req: Request, payload: any) {
		req['state'] = payload
		return true
	}
}