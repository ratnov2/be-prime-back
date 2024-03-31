import { Controller, Post, Body } from '@nestjs/common'
import { Model } from 'mongoose'
import * as cron from 'node-cron'
import { InjectModel } from 'nestjs-typegoose'
import { NotificationService } from 'src/notification/notification.service'
import { CronModel } from './cron.model'
import { MyCronService } from './cron.cervice'

@Controller('notifications')
export class CronController {
	constructor(
		@InjectModel(CronModel) private readonly cronModel: Model<CronModel>,
		private readonly notificationService: NotificationService,
		private readonly cronService: MyCronService
	) {
		cron.schedule('0 0 * * *', async () => {
			const now = new Date()
			// Вычисляем случайное количество времени в диапазоне от 9 до 23 часов
			const randomHours = Math.floor(Math.random() * (23 - 9 + 1) + 9)
			// Вычисляем случайное количество минут и секунд
			const randomMinutes = Math.floor(Math.random() * 60)
			const randomSeconds = Math.floor(Math.random() * 60)

			// Создаем новый объект Date с текущим временем и добавляем случайное количество часов, минут и секунд
			const scheduledTime = new Date(now.getTime())
			scheduledTime.setHours(randomHours)
			scheduledTime.setMinutes(randomMinutes)
			scheduledTime.setSeconds(randomSeconds)

			// Запускаем задачу в указанное время
			const cronTime = `${scheduledTime.getSeconds()} ${scheduledTime.getMinutes()} ${scheduledTime.getHours()} * * *`
			console.log(scheduledTime)

			// Сохраняем время запуска в базе данных
			// await this.saveCronTime(cronTime);

			setTimeout(async () => {
				const sends = notificationService.sends.bind(notificationService)
				await this.cronService.saveCronTime(cronTime, sends)
			}, randomHours * 3600 * 1000 + randomMinutes * 60 * 1000 + randomSeconds * 1000)
		})
	}
}

//
