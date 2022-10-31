import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { CreateConsumer, DoneConsumer } from './consumer-producer';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [
    BullModule.registerQueue(
      {
        name: 'create-notifications-queue',
        redis: {
          host: 'localhost',
          port: 6360,
        },
      },
      {
        name: 'done-notifications-queue',
        redis: {
          host: 'localhost',
          port: 6360,
        },
      }
    ),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsService, CreateConsumer, DoneConsumer],
})
export class NotificationsModule {}
