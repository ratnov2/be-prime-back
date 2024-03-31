import { Module } from '@nestjs/common'
import { NotificationController } from './notification.controller'
import { NotificationService } from './notification.service'
import { TypegooseModule } from 'nestjs-typegoose'
import { NotificationModel } from './notification.model'

@Module({
	imports: [TypegooseModule.forFeature([NotificationModel])],
	controllers: [NotificationController],
	providers: [NotificationService],
	exports: [NotificationService],
})
export class NotificationModule {}
