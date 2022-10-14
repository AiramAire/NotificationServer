import { Test, TestingModule } from '@nestjs/testing';
import { ReceivedNotificationDto, CreatedNotificationDto, Action } from './dto/notification.dto';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { RedisModule } from '@nestjs-modules/ioredis';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: NotificationsService;

  const createdNotification: ReceivedNotificationDto = {
    courseId: 'courseId',
    courseName: 'courseName',
    student: 'Noah',
    professor: 'Arrow',
    action: 3,
    actionsType: [
      {
        username: 'Arrow',
        action: [Action.Email, Action.Live_notification],
        email: 'email',
      },
    ],
    acceptAction: true,
  };

  const receivedNotification: CreatedNotificationDto = {
    notificationId: '0',
    courseId: 'courseId',
    courseName: 'courseName',
    username: 'Arrow',
    otherUser: 'Noah',
    action: 3,
    status: 0,
    text: 'some text',
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
      ],
      providers: [
        {
          provide: NotificationsService,
          useValue: {
            addNotifications: jest.fn().mockResolvedValue(receivedNotification),
            update: jest.fn().mockResolvedValue(receivedNotification),
          },
        },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('addNotifications', () => {
    it('adds new notifications', async () => {
      expect(service.addNotifications([createdNotification])).resolves.toEqual(
        receivedNotification
      );
    });
  });

  describe('update', () => {
    it('updates given notifications', async () => {
      receivedNotification.status = 1;
      expect(service.update([createdNotification.courseId])).resolves.toEqual(receivedNotification);
    });
  });
});
