import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Not, Repository } from 'typeorm';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { ERRORS } from '../common/constants/errors.const';
import { FindGroupsFiltersDTO } from '../common/dtos/page-options.dto';
import { LOG_ACTIONS } from '../common/enums/log-movements.enum';
import { LoggerService } from '../system-logs/logs.service';
import { Group, Permission } from '../entities';

@Injectable()
export class GroupsService {
	constructor(
		@InjectRepository(Group)
		private groupRepository: Repository<Group>,
		@InjectRepository(Permission)
		private permissionRepository: Repository<Permission>,
		private logger: LoggerService,
	) {
		logger.setContext(GroupsService.name)
	}

	async create(createGroupDto: CreateGroupDto, requestUserId: number,): Promise<Group> {
		const group = this.groupRepository.create(createGroupDto);
		await this.groupRepository.save(group);
		await this.logger.log(null, requestUserId, LOG_ACTIONS.NEW_REGISTER)
		return group
	}

	async findAll(pageOptionsDto: FindGroupsFiltersDTO): Promise<{ data: Group[]; total: number; }> {
		let where: FindOptionsWhere<Group> = {};
		if (pageOptionsDto.id) {
			where.id = pageOptionsDto.id;
		}
		if (pageOptionsDto.active) {
			where.isActive = true;
		}
		const [data, total] = await this.groupRepository.findAndCount({
			where,
			take: pageOptionsDto.take,
			skip: pageOptionsDto.skip,
			relations: pageOptionsDto.permissions && { permissions: true }
		},);
		return { data, total }
	}

	async findOne(id: number): Promise<Group> {
		const { data } = await this.findAll(new FindGroupsFiltersDTO({ id, permissions: true }))
		const group = data && data[0];
		if (!group) {
			throw new HttpException(ERRORS.User_Errors.ERR002, HttpStatus.NOT_FOUND);
		}
		return group;
	}

	async update(id: number, updateGroupDto: UpdateGroupDto, requestUserId: number,): Promise<void> {
		const exists = await this.groupRepository.findOne({
			where: {
				id: Not(id),
				name: ILike(updateGroupDto.name)
			}
		});
		if (exists) {
			throw new HttpException(ERRORS.ERR0P01, HttpStatus.BAD_REQUEST);
		}

		const group = await this.groupRepository.findOneBy({ id })
		if (group) {
			const oldName = group.name
			group.name = updateGroupDto.name
			group.order = updateGroupDto.order
			await this.groupRepository.save(group)

			await this.logger.log(null, requestUserId, LOG_ACTIONS.EDIT, { updatedId: id, name: oldName })
		}
	}
	async toggleActive(active: boolean, id: number, requestUserId: number): Promise<void> {
		await this.groupRepository.update({ id }, { isActive: active })
		await this.logger.log(null, requestUserId, LOG_ACTIONS.TOGGLE_ACTIVE, { id, active })
	}
	async delete(id: number, requestUserId: number): Promise<void> {
		const group = await this.groupRepository.findOneBy({ id })
		if (group) {
			await this.permissionRepository.update({ group: { id } }, { group: null })
			await this.groupRepository.softRemove(group)
			await this.logger.log(null, requestUserId, LOG_ACTIONS.DELETE, group)
		}
	}
}
