import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import {
  ReceivedNotificationDto,
  UserAction,
  CreatedNotificationDto,
  Action,
} from './dto/notification.dto';
import { RedisModule } from '@nestjs-modules/ioredis';
import { MailerModule } from '@nestjs-modules/mailer';
import { EjsAdapter } from '@nestjs-modules/mailer/dist/adapters/ejs.adapter';

describe('NotificationsService', () => {
  let service: NotificationsService;

  const receivedNotification: ReceivedNotificationDto = {
    courseId: 'courseId',
    courseName: 'courseName',
    student: 'Noah',
    professor: 'Arrow',
    action: 3,
    actionsType: [
      {
        username: 'Arrow',
        action: [Action.Live_notification],
        email: 'email',
      },
    ],
    acceptAction: true,
  };

  const createdNotification: CreatedNotificationDto = {
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
      providers: [NotificationsService],
      imports: [
        RedisModule.forRoot({
          config: {
            host: 'localhost',
            port: 6360,
          },
        }),
        MailerModule.forRoot({
          transport: {
            host: 'smtp.gmail.com',
            port: 465,
            // ignoreTLS: true,
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
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addNotifications', () => {
    it('creates notifications for different actions', () => {
      expect(service.addNotifications([receivedNotification])).resolves.toEqual([
        createdNotification,
      ]);
    });
  });

  describe('addNew', () => {
    it('creates one or two notifications for a given action', () => {
      expect(service.addNew(receivedNotification)).resolves.toEqual([createdNotification]);
    });
  });

  describe('update', () => {
    it('updates notifications', () => {
      expect(service.update(['someId'])).resolves.toEqual({});
    });
  });

  describe('createNotificationsText', () => {
    describe('creates the text for the notifications/emails', () => {
      describe('register action', () => {
        it('user is student and the action is accepted', () => {
          expect(
            service.createNotificationsText(UserAction.Register, '', 'math', true, 'Noah', true)
          ).toEqual('You have been registered in a new course: "math"');
        });

        it('user is student and the action is rejected', () => {
          expect(
            service.createNotificationsText(UserAction.Register, '', 'math', true, 'Noah', false)
          ).toEqual('Your registration request in course: "math" has been rejected');
        });

        it('user is not student', () => {
          expect(
            service.createNotificationsText(UserAction.Register, '', 'math', false, 'Noah', true)
          ).toEqual('Student Noah has been registered in your course: "math"');
        });
      });

      describe('unregister action', () => {
        it('user is student', () => {
          expect(
            service.createNotificationsText(UserAction.Unregister, '', 'math', true, 'Noah', true)
          ).toEqual('You have been unregistered in course: "math"');
        });
      });

      describe('see details action', () => {
        it('user is not student', () => {
          expect(
            service.createNotificationsText(
              UserAction.SeeDetailsStudent,
              '',
              'math',
              false,
              'Noah',
              true
            )
          ).toEqual('Student Noah has request access to details for your course: "math"');
        });
      });

      describe('see details professor action', () => {
        it('user is student and the action is accepted', () => {
          expect(
            service.createNotificationsText(
              UserAction.SeeDetailsProfessorAction,
              '',
              'math',
              true,
              'Noah',
              true
            )
          ).toEqual('You have been granted access to details for course: "math"');
        });

        it('user is student and the action is rejected', () => {
          expect(
            service.createNotificationsText(
              UserAction.SeeDetailsProfessorAction,
              '',
              'math',
              true,
              'Noah',
              false
            )
          ).toEqual('Your access request in course "math" has been rejected');
        });
      });

      describe('incorrect data', () => {
        it('it should return empty text', () => {
          expect(
            service.createNotificationsText(UserAction.SeeDetailsStudent, '', '', true, '', false)
          ).toEqual('');
        });
      });
    });
  });

  describe('createMail', () => {
    it('creates the emails', () => {
      expect(service.createMail('text', 'Noah', 'email')).toEqual(undefined);
    });
  });
});
