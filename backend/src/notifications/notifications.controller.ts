import { Body, Controller, Post, Get } from '@nestjs/common';
import { NotificationDto } from './dto/notification.dto';
import { NotificationsService } from './notifications.service';
import { InjectRedis, Redis } from '@nestjs-modules/ioredis';
import { Injectable } from '@nestjs/common';

@Controller('notifications')
export class NotificationsController {
  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly notificationsService: NotificationsService
  ) {}

  // @Post('addNew')
  // async addNew(@Body() data: NotificationDto): Promise<any> {
  //   return this.notificationsService.addNew(data);
  // }

  // @Post('update')
  // async update(@Body() data: NotificationDto): Promise<any> {
  //   return this.notificationsService.update(data);
  // }

  @Get()
  async getHello() {
    await this.redis.set('key', 'Redis data!');
    const redisData = await this.redis.get('key');
    return { redisData };
  }
}
