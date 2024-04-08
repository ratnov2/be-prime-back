import { Injectable } from '@nestjs/common'

import { Model } from 'mongoose'
import { CronModel } from './cron.model' // Путь к вашей модели cron
import { InjectModel } from 'nestjs-typegoose'
import { NotificationService } from 'src/notification/notification.service'

@Injectable()
export class MyCronService {
	constructor(
		@InjectModel(CronModel) private readonly cronModel: Model<CronModel>
	) {}

	async saveCronTime(cronTime: string, fn: () => void): Promise<void> {
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
		await fn()
	}
	async getCronTime(): Promise<Date> {
		const existingCronData = await this.cronModel.findOne()
		if (!existingCronData.lastRunTime) return undefined
		return existingCronData.lastRunTime
	}
	async runOnce() {
		const cronTime = await this.cronModel.findOne()
		if (!cronTime) {
			await this.cronModel.create({
				lastRunTime: new Date(),
				cronTime,
			})
		}
	}
	async setCronTime(date: string): Promise<Date> {
		if (!date) return new Date()
		const existingCronData = await this.cronModel.findOne()
		if (!existingCronData.lastRunTime) return undefined
		existingCronData.lastRunTime = new Date(date)
		await existingCronData.save()
	
	}
}
