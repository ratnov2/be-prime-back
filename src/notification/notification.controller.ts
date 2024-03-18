import { Controller, Post, Body } from '@nestjs/common';
import { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('send')
  async sendNotification(@Body() requestBody: { deviceToken: string, message: string }) {
    console.log(requestBody);
    
    const { deviceToken, message } = requestBody;
    this.notificationService.sendNotification(deviceToken, message);
    return { success: true };
  }
}
