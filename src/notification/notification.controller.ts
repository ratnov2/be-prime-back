import { Controller, Post, Body } from '@nestjs/common'
import { NotificationService } from './notification.service'

@Controller('notifications')
export class NotificationController {
	constructor(private readonly notificationService: NotificationService) {}

	@Post('send')
	async sendNotification(
		@Body() requestBody: { deviceToken: string; message: string }
	) {
		const { deviceToken, message } = requestBody
		this.notificationService.sendNotification(deviceToken, message)
		return { success: true }
	}

	@Post('sends')
	async sends() {
		return this.notificationService.sends()
	}
	@Post('add-device-token')
	async addUserExpoTicket(
		@Body() requestBody: { deviceToken: string; _id: string }
	) {
		const { deviceToken, _id } = requestBody
		return this.notificationService.addNotificationToken(deviceToken, _id)
	}
}
