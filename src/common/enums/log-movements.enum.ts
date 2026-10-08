export enum LOG_ACTIONS {
	LOGIN = 'INICIO DE SESIÓN',
	LOGOUT = 'CIERRE DE SESIÓN',
	EDIT_USER = 'EDITAR USUARIO',
	EDIT = 'EDITAR',
	NEW_REGISTER = 'CREAR',
	INACTIVE = 'ELIMINAR',
	REACTIVATE = 'ACTIVAR',
	DELETE = 'ELIMINAR',
	CHANGE_PASSWORD = 'CAMBIO CONTRASEÑA',
	SET_PERMISSIONS_TO_ROLE = 'ASIGNAR PERMISOS A ROL',
	CHANGE_PASSWORD_REQUEST = 'PETICIÓN DE CAMBIO DE CONTRASEÑA',
	TOGGLE_ACTIVE = 'ALTERNAR ACTIVO',

	ACTA_PRINT = 'IMPRIMIR ACTA',
	SOLICITUD_CHANGE_STATUS = 'CAMBIAR ESTATUS SOLICITUD',
}

export type LogActionDataType<T extends LOG_ACTIONS> =
	T extends LOG_ACTIONS.NEW_REGISTER ? {
		registeredId: number;
	}
	: T extends LOG_ACTIONS.LOGIN ? {
		ip: string;
	}
	: T extends LOG_ACTIONS.LOGOUT ? { }
	: T extends LOG_ACTIONS.EDIT_USER ? {
		id?: number,
		email?: string,
		password?: string,
		roles?: { id: number }[]
	}
	: T extends LOG_ACTIONS.TOGGLE_ACTIVE ? {
		id: number | string,
		active: boolean
	}
	: T extends LOG_ACTIONS.EDIT ? {
		updatedId: number | string,
		[key: string]: any
	}
	: T extends LOG_ACTIONS.SET_PERMISSIONS_TO_ROLE ? {
		roleId: number,
		permissionsIds: number[]
	}
	: T extends LOG_ACTIONS.ACTA_PRINT ? {
		actaId: number
	}
	: T extends LOG_ACTIONS.SOLICITUD_CHANGE_STATUS ? {
		solicitudId: number
		previousStatus: number
	}
	: T extends LOG_ACTIONS.DELETE ? {
		[key: string]: any
	}
	: any;
