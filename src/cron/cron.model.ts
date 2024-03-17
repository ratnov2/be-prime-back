import { prop } from '@typegoose/typegoose'

export class CronModel {
	@prop({ type: Date })
	lastRunTime: Date
}
