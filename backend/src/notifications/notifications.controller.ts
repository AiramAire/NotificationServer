import { InjectRedis, Redis } from '@nestjs-modules/ioredis';
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { CreatedNotificationDto, ReceivedNotificationDto } from './dto/notification.dto';
import { NotificationsService } from './notifications.service';

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

  @Post('addNew')
  async addNew(@Body() data: ReceivedNotificationDto): Promise<CreatedNotificationDto[]> {
    return this.notificationsService.addNew(data);
  }

  @Post('update')
  async update(@Param('id') id: string): Promise<CreatedNotificationDto> {
    return this.notificationsService.update(id);
  }

  @Get()
  async getHello() {
    await this.redis.set('key', 'Redis data!');
    const redisData = await this.redis.get('key');
    return { redisData };
  }
}
