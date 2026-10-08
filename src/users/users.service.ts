import { HttpException, Injectable } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common/enums';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { plainToInstance } from 'class-transformer';
import { compareAsc } from 'date-fns';
import {
	DeepPartial,
	FindManyOptions,
	FindOptionsWhere,
	ILike,
	In,
	Like,
	Not,
	Repository,
} from 'typeorm';
import { ERRORS } from '../common/constants/errors.const';
import { FindUsersFiltersDTO } from '../common/dtos/page-options.dto';
import { LOG_ACTIONS } from '../common/enums/log-movements.enum';
import { dashboard_user, Permission, PermissionRole, Role, RoleUser, User } from '../entities';
import { TypeToken, UserTokens } from '../entities/usr/user-tokens.entity';
import { PermissionDto } from '../permissions/dto/permission.dto';
import { RoleDto } from '../roles/dto/role.dto';
import { LoggerService } from '../system-logs/logs.service';
import { UtilsService } from '../utils.service';
import { CreateUserDto } from './dto/create-user.dto';
import { EditProfileDto } from './dto/edit-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { MailProvider } from '../common/providers/mail.provider';
import { HttpStatusCode } from 'axios';
import { MapaService } from 'src/dashboard-manager/mapa.service';

@Injectable()
export class UsersService {
	constructor(
		@InjectRepository(User)
		private userRepository: Repository<User>,
		@InjectRepository(Role)
		private roleRepository: Repository<Role>,
		@InjectRepository(RoleUser)
		private roleUserRepository: Repository<RoleUser>,
		@InjectRepository(UserTokens)
		private userTokensRepository: Repository<UserTokens>,
		@InjectRepository(PermissionRole)
		private permissionRoleRepository: Repository<PermissionRole>,
		private logger: LoggerService,
		private mail: MailProvider,
		@InjectRepository(dashboard_user)
		private dashboardUserRepository: Repository<dashboard_user>,
		private readonly mapaService: MapaService
	) {
		logger.setContext(UsersService.name)
	}

	private readonly RED_TRONCAL_ROLE_ID = 7;

	private async hasRedTroncalRole(roleIds?: number[]): Promise<boolean> {
		if (!roleIds?.length) {
			return false;
		}

		const roles = await this.roleRepository.findBy({
			id: In(roleIds),
			isActive: true,
		});

		return roles.some((role) => {
			const name = (role.name ?? '').trim().toUpperCase();

			return name === 'MAPA RED TRONCAL' || name === 'MAPA';
		});
	}

	async create(createUserDto: CreateUserDto, requestUserId: number): Promise<User> {
		console.log(createUserDto);

		const passwordHashed = bcrypt.hashSync(createUserDto.password, 10);

		const {
			redTroncalPerfil,
			roleIds,
			confirmPassword,
			...createPayload
		} = createUserDto as any;

		const userPayload: DeepPartial<User> = {
			...createPayload,
			puesto: createUserDto.puesto,
			password: passwordHashed,
			createdBy: requestUserId,
		};

		const user = this.userRepository.create(userPayload);

		await this.userRepository.save(user);

		let rolesUser: RoleUser[] = [];

		if (roleIds && roleIds.length) {
			const roles = await this.roleRepository.findBy({
				id: In(roleIds),
				isActive: true,
			});

			if (!roles.length) {
				throw new HttpException(
					ERRORS.Roles_Errors.ERR008,
					HttpStatus.NOT_FOUND,
				);
			}

			rolesUser = roles.map((rol) =>
				this.roleUserRepository.create({
					role: rol,
					user: user,
				}),
			);

			await this.roleUserRepository.save(rolesUser);
		}

		user.roleUsers = rolesUser;

		await this.mapaService.syncRedTroncalCustomProfileForUser({
			userId: user.id,
			userUuid: user.uuid,
			enabled: await this.hasRedTroncalRole(roleIds),
			layers: redTroncalPerfil?.layers ?? [],
		});

		await this.logger.log(null, requestUserId, LOG_ACTIONS.NEW_REGISTER, {
			registeredId: user.id,
		});

		return user;
	}

	async findAll(pageOptionsDto: FindUsersFiltersDTO): Promise<{ data: User[]; total: number; }> {
		let where: FindOptionsWhere<User> | FindOptionsWhere<User>[] = {};
		if (pageOptionsDto.name) {
			const ilikeValue = ILike(`%${pageOptionsDto.name}%`);
			where = [
				{ name: ilikeValue },
				{ email: ilikeValue },
				{ firstName: ilikeValue },
				{ secondName: ilikeValue },
			];
		}
		// if (pageOptionsDto.uuid) {
		// 	where = {}
		// 	where.uuid = pageOptionsDto.uuid;
		// }
		// if (pageOptionsDto.id) {
		// 	where = {}
		// 	where.id = pageOptionsDto.id;
		// }
		const dbQuery: FindManyOptions<User> = {
			where,
			order: pageOptionsDto.orderByParams(),
			take: pageOptionsDto.take,
			skip: pageOptionsDto.skip,
			relations: ['roleUsers.role'],
		};
		const [data, total] = await this.userRepository.findAndCount(dbQuery);
		return { data, total }
	}

	async findOne(uuid: string): Promise<User> {
		const user = await this.userRepository.findOne({where:{uuid}, relations: ['roleUsers', 'roleUsers.role']})
		// console.log(user)
		if (!user) {
			throw new HttpException(ERRORS.User_Errors.ERR002, HttpStatus.NOT_FOUND);
		}
		return user;
	}

	async update(uuid: string, updateUserDto: UpdateUserDto, requestUserId: number): Promise<void> {
		console.log("========= [Init] =========")
		console.log(`uid: ${uuid}`)
		console.log(`updateUserDto: ${updateUserDto}`)
		const existsEmail = await this.userRepository.findOne({
			where: {
				uuid: Not(uuid),
				email: updateUserDto.email,
			},
		});
		if (existsEmail) { throw new HttpException(ERRORS.Validation_errors.ERR011, HttpStatus.BAD_REQUEST,); }

		if (updateUserDto.password && updateUserDto.password.trim()) {
			updateUserDto.password = bcrypt.hashSync(updateUserDto.password, 10);
		} else {
			delete updateUserDto.password;
		}

		const user = await this.findOne(uuid)
		if (!user) { throw new HttpException(ERRORS.User_Errors.ERR002, HttpStatus.BAD_REQUEST,); }


		const { redTroncalPerfil, roleIds, confirmPassword, ...userUpdatePayload } = updateUserDto as any;

		Object.assign(user, userUpdatePayload);

		// Save the updated user
		await this.userRepository.save(user);

		let oldRoles
		console.log(user)
		if (Array.isArray(roleIds) && roleIds.length > 0) {
			oldRoles = user.roleUsers.map((i) => ({ id: i.roleId }));
			const roles = roleIds.map((i) => new Role({ id: i }));
			const rolesUser = roles.map((rol) => new RoleUser({ role: rol, user: user }));
			await this.roleUserRepository.remove(user.roleUsers);
			await this.roleUserRepository.save(rolesUser);
		} else if (Array.isArray(roleIds) && roleIds.length === 0) {
			console.log('Aqui se entra cuando no hay ningun rol');
			await this.roleUserRepository.delete({ userId: user.id });
		}

		await this.mapaService.syncRedTroncalCustomProfileForUser({
			userId: user.id,
			userUuid: user.uuid,
			enabled: await this.hasRedTroncalRole(roleIds),
			layers: redTroncalPerfil?.layers ?? [],
		});

		await this.logger.log(null, requestUserId, LOG_ACTIONS.EDIT_USER, {
			id: user.id, email: user.email, password: user.password, roles: oldRoles
		})
	}

	async deleteUser(uid: string, userAction: string): Promise<void> {
        // Check if the user exists
        const user = await this.findOne(uid)
        if (!user) {
            throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        }
		const rolesUsr = user.roleUsers
		const firstRole = rolesUsr[0]
		if(firstRole){
			const resultDeleteRoles = await this.roleUserRepository.delete({userId: firstRole.userId})
			if(resultDeleteRoles.affected == 0){
				throw new HttpException('roles not deleted', HttpStatusCode.Conflict)
			}
		}

		const prevName = await this.getUserNameById(user.uuid)

		// borrando relaciones
		const resultDelete = await this.dashboardUserRepository.delete({user_id: user.uuid})
		
		// Perform the deletion
        const result = await this.userRepository.delete({uuid: uid});
		if (result.affected === 0) {
			throw new HttpException('User not found', HttpStatus.NOT_FOUND);
		}else{
			await this.logger.log(`El usuario ${await this.getUserNameById(userAction)} elimino al usuario ${prevName}`,1, LOG_ACTIONS.DELETE, {uidDeleted: uid})
		}
    }

	async toggleActive(active: boolean, uuid: string, requestUserId: number): Promise<void> {
		const result = await this.userRepository.update({ uuid }, { isActive: active })
		await this.logger.log(null, requestUserId, LOG_ACTIONS.TOGGLE_ACTIVE, { id: uuid, active })
	}

	async editProfile(profileId: number, editProfileDto: any, userId: number,): Promise<any> {
		const user = await this.userRepository.findOne({
			where: {
				id: profileId,
				isActive: true,
			},
		});

		if (!user) {
			throw new HttpException(ERRORS.User_Errors.ERR002, HttpStatus.NOT_FOUND);
		}

		delete editProfileDto.confirmPassword

		if (editProfileDto.password && !UtilsService.isNoE(editProfileDto.password.trim())) {
			editProfileDto.password = bcrypt.hashSync(editProfileDto.password, 10);
		} else {
			delete editProfileDto.password;
		}
		await this.userRepository.update({ id: profileId }, editProfileDto)

		// const profileDto = plainToInstance(ProfileDto, user);

		await this.logger.log('', userId, LOG_ACTIONS.EDIT, { updatedId: profileId, profile: true });

		return user;
	}


	async getUserRoles(userId: number): Promise<RoleDto[]> {
		const roleUsers = await this.roleUserRepository.find({
			where: {
				userId,
			},
			relations: { role: true },
		});

		const rolesList = roleUsers.filter((i) => i.role).map((roleUser) => roleUser.role);
		const rolesDto = plainToInstance(RoleDto, rolesList);
		return rolesDto;
	}

	async getUserPermission(userId: number): Promise<PermissionDto[]> {
		const permissionRoles = await this.permissionRoleRepository.find({
			where: { role: { roleUsers: { userId }, isActive: true } },
			relations: ['role', 'permission']
		})

		return permissionRoles.map((i) => plainToInstance(PermissionDto, i.permission));
	}

	async registerUserToken(userId: number, typeToken: TypeToken, token: string, expireOn: Date) {
		let existingToken = await this.userTokensRepository.findOneBy({
			userId, typeToken
		})
		if (existingToken) {
			this.userTokensRepository.remove(existingToken)
		}
		let newToken = new UserTokens({
			userId, typeToken, token, expireOn,
		})
		return this.userTokensRepository.save(newToken)
	}
	async validateUserToken(token: string, typeToken: TypeToken, extraWhere: FindOptionsWhere<UserTokens> = null) {
		let whereClause: FindOptionsWhere<UserTokens> = { token, typeToken }
		if (extraWhere) {
			whereClause = {
				...whereClause,
				...extraWhere
			}
		}
		const ut = await this.userTokensRepository.findOneBy(whereClause)
		if (!ut) {
			throw new Error('No token found')
		}
		if (compareAsc(new Date(), ut.expireOn) === 1) {
			await this.userTokensRepository.remove(ut)
			throw new Error('Token expire')
		}
		return ut;
	}

	async getUserNameById(uid:string){
        const usr = await this.userRepository.findOne({where:{ uuid: uid}})

        if (!usr) {
            // Handle the case where the user is not found
            throw new Error('User not found');
        }
    
        // Concatenate the name fields
        const completeName = `${usr.name} ${usr.firstName} ${usr.secondName}`.trim();
        return completeName;
    }

}
