import { Injectable } from '@nestjs/common'
import { ModelType } from '@typegoose/typegoose/lib/types'
import Expo, { ExpoPushToken } from 'expo-server-sdk'
import { InjectModel } from 'nestjs-typegoose'
import { NotificationModel } from './notification.model'

const expo = new Expo()

@Injectable()
export class NotificationService {
	constructor(
		@InjectModel(NotificationModel)
		private readonly NotificationModel: ModelType<NotificationModel>
	) {}
	async sendNotification(deviceToken: string, message2: string) {
		// Check that all your push tokens appear to be valid Expo push tokens
		if (!Expo.isExpoPushToken(deviceToken)) {
			console.error(`expo-push-token is not a valid Expo push token`)
		}
		const messages = []
		//user.map()
		const message = {
			to: deviceToken,
			data: { extraData: 'Some data' },
			title: 'be-prime',
			body: message2,
		}
		messages.push(message)
		const chunks = expo.chunkPushNotifications(messages)
		const tickets = []

		try {
			;(async () => {
				for (const chunk of chunks) {
					try {
						const ticketChunk = await expo.sendPushNotificationsAsync(chunk)
						tickets.push(...ticketChunk)
					} catch (error) {
						console.error(error)
					}
				}
			})()
		} catch (error) {
			console.error(error)
		}
	}
	async addNotificationToken(deviceToken: string, _id: string) {
		const user = await this.NotificationModel.findById(_id)
		if (!user) {
			const token = new this.NotificationModel({
				_id,
				deviceToken,
			})
			await token.save()
		} else {
			user.deviceToken = deviceToken
			await user.save()
		}
		return { message: true }
	}
	async sends() {
		const user = await this.NotificationModel.find()
		if (!user) return { message: true }
		const messages = []
		const message2 = '5 min left to capture a BePrime'
		user.map((user) => {
			const message = {
				to: user.deviceToken,
				data: { extraData: 'Some data' },
				title: '🙈 Time to BePrime 🙈',
				body: message2,
			}
			messages.push(message)
		})
		const chunks = expo.chunkPushNotifications(messages)
		const tickets = []
		try {
			;(async () => {
				for (const chunk of chunks) {
					try {
						const ticketChunk = await expo.sendPushNotificationsAsync(chunk)
						tickets.push(...ticketChunk)
					} catch (error) {
						console.error(error)
					}
				}
			})()
		} catch (error) {
			console.error(error)
		}

		return { message: true }
	}
}
