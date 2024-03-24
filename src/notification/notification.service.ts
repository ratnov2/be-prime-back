import { Injectable } from '@nestjs/common'
import Expo, { ExpoPushToken } from 'expo-server-sdk'

const expo = new Expo()

@Injectable()
export class NotificationService {
	async sendNotification(deviceToken: string, message2: string) {
		// Check that all your push tokens appear to be valid Expo push tokens
		if (!Expo.isExpoPushToken(deviceToken)) {
			console.error(`expo-push-token is not a valid Expo push token`)
		}
		const messages = []
		const message = {
			to: deviceToken,
			data: { extraData: 'Some data' },
			title: 'EZ CAEF',
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
}
