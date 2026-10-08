import { Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { MailProvider } from '../common/providers/mail.provider';
import { Log, User, UserTokens } from '../entities';
import { RtStrategy } from './strategies/rt.strategy';
import { StateStrategy } from './strategies/state.strategy';

@Module({
	imports: [
		TypeOrmModule.forFeature([User, UserTokens, Log]),
		UsersModule,
		PassportModule,
		JwtModule.register({
			secret: process.env.JWT_SECRET_KEY,
			signOptions: { expiresIn: '9999s' },
		}),
	],
	providers: [AuthService, JwtStrategy, JwtService, RtStrategy, StateStrategy, MailProvider],
	controllers: [AuthController],
})
export class AuthModule { }
