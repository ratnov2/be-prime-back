import { Injectable } from '@nestjs/common'
import Expo, { ExpoPushToken } from 'expo-server-sdk'

const expo = new Expo()

@Injectable()
export class NotificationService {
	async sendNotification(deviceToken: string, message2: string) {
		// Check that all your push tokens appear to be valid Expo push tokens
		if (!Expo.isExpoPushToken("APA91bEOlBTitjek1tv5yNXnjYst0VKKyVH8Tgkb-TzT0PsipcEizavom7KTkp-AEkfYV26qZpnWte57aCCtzoCw_qXOojc1M26Sh-PB34B7nVEHDFf19MdUYmnNJW6MwqOD2XbMHxDH")) {
			console.error(`expo-push-token is not a valid Expo push token`)
		}
		const messages = []
		const message = {
			to: deviceToken,
			data: { extraData: 'Some data' },
			title: 'Sent by backend server',
			body: 'This push notification was sent by a backend server!',
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
