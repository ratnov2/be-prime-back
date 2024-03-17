// import { Injectable } from '@nestjs/common'
// import * as cron from 'node-cron'
// import { Model } from 'mongoose'

// import { CronModel } from './cron.model' // Путь к вашей модели cron
// import { InjectModel } from 'nestjs-typegoose'

// @Injectable()
// export class MyCronService {
// 	constructor(
// 		@InjectModel(CronModel) private readonly cronModel: Model<CronModel>
// 	) {
// 		cron.schedule('* * * * *', async () => {
// 			console.log('Cron job is running...')
// 			// Сохраняем время последнего запуска cron в базу данных

// 			const cronData = await this.cronModel.findOne()

// 			if (cronData) {
// 				cronData.lastRunTime = new Date()
// 				await cronData.save()
// 			} else {
// 				await this.cronModel.create({ lastRunTime: new Date() })
// 			}
// 		})
// 	}
// }
import { Injectable } from '@nestjs/common'
import * as cron from 'node-cron'
import { Model } from 'mongoose'
import { CronModel } from './cron.model' // Путь к вашей модели cron
import { InjectModel } from 'nestjs-typegoose'

@Injectable()
export class MyCronService {
	constructor(
		@InjectModel(CronModel) private readonly cronModel: Model<CronModel>
	) {
		cron.schedule('0 0 * * *', async () => {
			console.log('Cron job is running...')

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
				console.log(cronTime)

				await this.saveCronTime(cronTime)
			}, randomHours * 3600 * 1000 + randomMinutes * 60 * 1000 + randomSeconds * 1000)
		})
	}

	async saveCronTime(cronTime: string): Promise<void> {
		const existingCronData = await this.cronModel.findOne()
		if (existingCronData) {
			existingCronData.lastRunTime = new Date()
			await existingCronData.save()
		} else {
			await this.cronModel.create({
				lastRunTime: new Date(),
				cronTime,
			})
		}
	}
}
