import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationService {
  sendNotification(deviceToken: string, message: string): void {
    // Здесь будет код для отправки уведомления на устройство
    console.log(`Sending notification to device ${deviceToken}: ${message}`);
  }
}
