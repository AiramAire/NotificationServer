import { Body, Controller, Post } from '@nestjs/common';
import { ReceivedNotificationDto } from './dto/notification.dto';
import { NotificationsService } from './notifications.service';

export class ReceivedDataNotification {
  body: ReceivedNotificationDto[];
}
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('addNotifications')
  async addNotifications(@Body() data: ReceivedDataNotification): Promise<void> {
    this.notificationsService.addNotifications(data.body);
  }
}
