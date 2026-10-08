export type EmailTemplateTypes = { 
	type: 'reset-password',
	token: string
	username: string
} | {
	type: 'account-activation',
	activation_code: string,
	expiration_in_minutes: number,
	username: string
} | {
	type: 'welcome-new-user',
	password: string
	username: string
}

export interface IMail {
	to: string[];
	from?: string;
	template: EmailTemplateTypes
}