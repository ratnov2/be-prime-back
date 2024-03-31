import { Module, forwardRef } from '@nestjs/common'
import { MyCronService } from './cron.cervice'
import { CronModel } from './cron.model'
import { TypegooseModule } from 'nestjs-typegoose'
import { NotificationService } from 'src/notification/notification.service'
import { NotificationModel } from 'src/notification/notification.model'
import { NotificationModule } from 'src/notification/notification.module'
import { UserModel } from 'src/user/user.model'
import { NotificationController } from 'src/notification/notification.controller'
import { CronController } from './cron.controller'

@Module({
	imports: [
		TypegooseModule.forFeature([
			{
				typegooseClass: CronModel,
				schemaOptions: {
					collection: 'cronmodels',
				},
			},
			{
				typegooseClass: NotificationModel,
				schemaOptions: {
					collection: 'notificationmodels',
				},
			},
		]),
		forwardRef(() => NotificationModule),
	],
	controllers: [CronController],
	providers: [MyCronService, NotificationService],
	// exports: [NotificationService],
	// providers: [MyCronService],
	exports: [MyCronService],
})
export class CronModule {}
