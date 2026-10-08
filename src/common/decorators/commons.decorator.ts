import { ExecutionContext, SetMetadata, UnauthorizedException, createParamDecorator } from '@nestjs/common';
import { TypePermissions } from '../enums/access.enum';
import { UserRequest } from '../interfaces/user-request.model';
import { UtilsService } from '../../utils.service';

export const PUBLIC_DECORATOR_KEY = 'isPublic'
export const PERMISSIONS_DECORATOR_KEY = 'permissions'

export const Permissions = (...permissions: number[]) => SetMetadata(PERMISSIONS_DECORATOR_KEY, permissions);

export const Public = () => SetMetadata(PUBLIC_DECORATOR_KEY, true);

export const GetCurrentUserId = createParamDecorator(
	(data: undefined, context: ExecutionContext): number => {
		const request = context.switchToHttp().getRequest();
		return request.user['id'];
	},
);

export const GetCurrentUserUid = createParamDecorator(
	(data: undefined, context: ExecutionContext): number => {
		const request = context.switchToHttp().getRequest();
		return request.user['uuid'];
	},
);

export const GetCurrentUser = createParamDecorator(
	(data: string | undefined, context: ExecutionContext) => {
		const request = context.switchToHttp().getRequest();
		if (!data) return request.user;
		return request.user[data];
	},
);
