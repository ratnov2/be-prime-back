import { Module } from '@nestjs/common'
import { UserService } from './user.service'
import { UserController } from './user.controller'
import { TypegooseModule } from 'nestjs-typegoose'
import { UserModel } from './user.model'
import { MyCronService } from 'src/cron/cron.cervice'
import { CronModel } from 'src/cron/cron.model'

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
		]),
		TypegooseModule.forFeature([
			{
				typegooseClass: CronModel,
				schemaOptions: {
					collection: 'cronmodels',
				},
			},
		]),
	],
	providers: [UserService,MyCronService],
	exports: [UserService],
})
export class UserModule {}
