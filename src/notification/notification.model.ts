import { prop } from '@typegoose/typegoose'

export class NotificationModel {
	@prop()
	_id: string

	@prop()
	deviceToken: string
}
