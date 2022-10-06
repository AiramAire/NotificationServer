import { InjectRedis, Redis } from '@nestjs-modules/ioredis';
import { Injectable } from '@nestjs/common';
import { NotificationDto, NotificationState } from './dto/notification.dto';

@Injectable()
export class NotificationsService {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  async addNew(data: NotificationDto): Promise<any> {
    data.notificationId = this.redis.getAll().length + 1;
    await this.redis.set(data.notificationId, data);
    const redisData = await this.redis.get(data.notificationId);
    return { redisData };
  }

  async update(data: NotificationDto): Promise<any> {
    const redisData = await this.redis.get(data.notificationId);
    redisData.status = NotificationState.Read;
    await this.redis.set(data.notificationId, redisData);
  }
}
