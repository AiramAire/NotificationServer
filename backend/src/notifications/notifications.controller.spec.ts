import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController, ReceivedDataNotification } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { RedisModule } from '@nestjs-modules/ioredis';
import { BullModule } from '@nestjs/bull';
import { MailerModule } from '@nestjs-modules/mailer';
import { EjsAdapter } from '@nestjs-modules/mailer/dist/adapters/ejs.adapter';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: NotificationsService;

  const data: ReceivedDataNotification = {
    body: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      imports: [
        RedisModule.forRoot({
          config: {
            host: 'localhost',
            port: 6360,
          },
        }),
        BullModule.registerQueue({
          name: 'done-notifications-queue',
        }),
        MailerModule.forRoot({
          transport: {
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
              user: 'academinimailtest@gmail.com',
              pass: 'tpdrdbvplrfcgpfn',
            },
          },
          options: {
            strict: false,
          },
          defaults: {
            from: '"No Reply" <no-reply@gmail.com>',
          },
          preview: false,
          template: {
            dir: process.cwd() + '/template/',
            adapter: new EjsAdapter(),
            options: {
              strict: true,
            },
          },
        }),
      ],
      providers: [NotificationsService],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('addNotifications', () => {
    it('adds new notifications', async () => {
      const spyData = jest.spyOn(service, 'addNotifications');
      controller.addNotifications(data);
      expect(spyData).toHaveBeenCalledWith([]);
    });
  });
});
