import { Module } from '@nestjs/common'
import { MyCronService } from './cron.cervice'
import { CronModel } from './cron.model'
import { TypegooseModule } from 'nestjs-typegoose'

@Module({
    imports: [TypegooseModule.forFeature([CronModel])],
    providers: [MyCronService],
})
export class CronModule {}
