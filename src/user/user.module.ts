import { Module } from '@nestjs/common'
import { UserService } from './user.service'
import { UserController } from './user.controller'
import { TypegooseModule } from 'nestjs-typegoose'
import { UserModel } from './user.model'
import { MyCronService } from 'src/cron/cron.cervice'
import { CronModel } from 'src/cron/cron.model'
import { NotificationService } from 'src/notification/notification.service'
import { NotificationModel } from 'src/notification/notification.model'

@Module({
	controllers: [UserController],
	imports: [
		TypegooseModule.forFeature([
			{
				typegooseClass: UserModel,
				schemaOptions: {
					collection: 'User',
				},
			},
			NotificationModel,CronModel
		]),
		
	],
	providers: [UserService, MyCronService, NotificationService],
	exports: [UserService],
})
export class UserModule {}
