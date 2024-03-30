import { Module } from '@nestjs/common'
import { ServeStaticModule } from '@nestjs/serve-static'
import { path } from 'app-root-path'

import { FilesController } from './files.controller'
import { FilesService } from './files.service'
import { UserModule } from 'src/user/user.module'
import { TypegooseModule } from 'nestjs-typegoose'
import { UserModel } from 'src/user/user.model'
import { MyCronService } from 'src/cron/cron.cervice'
import { CronModule } from 'src/cron/genre.module'
import { CronModel } from 'src/cron/cron.model'

@Module({
	imports: [
		TypegooseModule.forFeature([
			{
				typegooseClass: UserModel,
				schemaOptions: {
					collection: 'User',
				},
			},
			{
				typegooseClass: CronModel,
				schemaOptions: {
					collection: 'cronmodels',
				},
			},
		]),

		ServeStaticModule.forRoot({
			rootPath: `${path}/uploads`,
			serveRoot: '/uploads',
		}),
		CronModule,
	],
	providers: [FilesService],
	controllers: [FilesController],
})
export class FilesModule {}
