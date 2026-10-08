import { ConfigService } from '@nestjs/config';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { EmailTemplateTypes, IMail } from '../interfaces/mail.interface';
import * as SendGrid from '@sendgrid/mail';
import { readFile } from 'fs/promises';
import * as path from 'path';
import { AppSettings } from '../../app.settings';

@Injectable()
export class MailProvider {
	constructor(private readonly ConfigService: ConfigService) { }

	async sendMail(mail: IMail) {
		try {
			mail.from = mail.from || process.env.SENGRID_FROM_EMAIL
			SendGrid.setApiKey(this.ConfigService.get('SENGRID_API_KEY'));
			const templateInfo = await this.getTemplate(mail.template)
			const msg = {
				to: mail.to,
				from: mail.from,
				subject: templateInfo.subject,
				html: templateInfo.html,
			};

			const sendEmail = await SendGrid.send(msg);
			return sendEmail;
		} catch (error) {
			throw new InternalServerErrorException('Error inesperado al enviar el correo electrónico', { cause: error })
		}
	}
	private async getTemplate(template: EmailTemplateTypes) {
		let templateInfo = {
			subject: '',
			html: ''
		};
		let content = ''
		switch (template.type) {
			case 'reset-password':
				let url = `${process.env.FRONTEND_URL}/reset-password?token=${template.token}`
				content = await this.getFileTemplateContent('reset-password.template.html')
				content = content.replace(/{{username}}/g, template.username).replace(/{{url}}/g, url)
				templateInfo.subject = 'Solicitud de restablecimiento de contraseña'
				templateInfo.html = content
				break;
			case 'account-activation':
				templateInfo.subject = 'Portal plantilla base'
				content = await this.getFileTemplateContent('activation-code.template.html')
				content = content.replace(/{{username}}/g, template.username).replace(/{{code}}/g, template.activation_code).replace(/{{expiration}}/g, template.expiration_in_minutes.toString())
				templateInfo.html = content
				break;
			case 'welcome-new-user':
				templateInfo.subject = 'Portal plantilla base, Tu password de inicio de sesión'
				content = await this.getFileTemplateContent('welcome-new-user.template.html')
				content = content.replace(/{{username}}/g, template.username).replace(/{{password}}/g, template.password)
				templateInfo.html = content
				break;
			default:
				break;
		}
		return templateInfo;
	}
	private async getFileTemplateContent(templatFileName: string) {
		const file = await readFile(path.join(AppSettings.basepath, 'assets/email-templates/', templatFileName))
		return file.toString()
	}
}