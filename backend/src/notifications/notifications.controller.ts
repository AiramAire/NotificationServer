import { InjectRedis, Redis } from '@nestjs-modules/ioredis';
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { CreatedNotificationDto, ReceivedNotificationDto } from './dto/notification.dto';
import { NotificationsService } from './notifications.service';

export class ReceivedDataNotification {
  body: ReceivedNotificationDto[];
}

export class ReceviedDataIds {
  body: string[];
}

@Controller('notifications')
export class NotificationsController {
  private client: ClientProxy;

  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly notificationsService: NotificationsService
  ) {
    this.client = ClientProxyFactory.create({
      transport: Transport.REDIS,
      options: {
        url: 'redis://localhost:6360',
      },
    });
  }

  @Post('addNotifications')
  async addNew(@Body() data: ReceivedDataNotification): Promise<CreatedNotificationDto[]> {
    return this.notificationsService.addNotifications(data.body);
  }

  @Post('update')
  async update(@Body() data: ReceviedDataIds): Promise<void> {
    await this.notificationsService.update(data.body);
  }
}
