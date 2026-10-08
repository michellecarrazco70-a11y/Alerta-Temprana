import { Transform, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsNumber, IsNumberString, IsOptional, IsString, Min } from 'class-validator';
import { User } from '../../entities';
import { isValid, parseISO } from 'date-fns';


export class PaginationResponseDTO<T> {
	data: T[] = []
	total: number = 0
	skip: number = 0
	take: number = 10
	constructor(data: Partial<PaginationResponseDTO<T>>) {
		Object.assign(this, data)
	}
}

export class QueryDataState {
	@IsInt()
	@Min(0)
	@IsOptional()
	@Type(() => Number)
	skip?: number

	@IsInt()
	@Min(1)
	@IsOptional()
	@Type(() => Number)
	take?: number

	@IsString()
	@IsOptional()
	sort?: string

	@IsOptional()
	@IsString()
	search: string

	orderByParams(allowedFields: string[]) {
		if (!this.sort) {
			return {};
		}

		return this.sort.split(',').map((field) => {
			const direction = field.startsWith('-') ? 'DESC' : 'ASC';
			const fieldName = field.replace(/^-/, '').replace(/^\+/, '').trim();
			return { [fieldName]: direction };
		}).filter((i) => allowedFields.includes(Object.keys(i)[0])).reduce((result, obj) => ({ ...result, ...obj }), {});
	}
}

export class FindUsersFiltersDTO extends QueryDataState {
	@IsOptional()
	@IsNumber()
	id?: number
	@IsOptional()
	@IsString()
	uuid?: string
	@IsOptional()
	@IsString()
	name?: string


	@IsArray()
	private readonly orderBy: (keyof User)[] = [ 'name', 'email']
	orderByParams() {
		return super.orderByParams(this.orderBy)
	}
	constructor(data?: Partial<FindUsersFiltersDTO>) {
		super()
		Object.assign(this, data)
	}
}
export class FindCommonsFiltersDTO extends QueryDataState {
	@IsOptional()
	@IsNumber()
	id?: number
	@IsOptional()
	@Transform(param => param.value === true || param.value === 'true')
	@IsBoolean()
	active?: boolean

	constructor(data?: Partial<FindCommonsFiltersDTO>) {
		super()
		Object.assign(this, data)
	}
}
export class FindGroupsFiltersDTO extends FindCommonsFiltersDTO {
	@IsOptional()
	@Transform(param => param.value === true || param.value === 'true')
	@IsBoolean()
	permissions?: boolean
	constructor(data?: Partial<FindGroupsFiltersDTO>) {
		super()
		Object.assign(this, data)
	}
}