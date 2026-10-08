import { LOG_ACTIONS } from '../../common/enums/log-movements.enum';

export interface CreateLogDto {
	userId?: number
	message?: string
	action?: LOG_ACTIONS
	stack?: string
	data?: string | object
}
