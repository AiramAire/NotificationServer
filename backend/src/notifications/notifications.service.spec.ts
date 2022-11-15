import { RedisModule } from '@nestjs-modules/ioredis';
import { MailerModule, MailerService } from '@nestjs-modules/mailer';
import { EjsAdapter } from '@nestjs-modules/mailer/dist/adapters/ejs.adapter';
import { BullModule } from '@nestjs/bull';
import { Test, TestingModule } from '@nestjs/testing';
import { DoneConsumer } from './consumer-producer';
import {
  Action,
  FeedbackForm,
  NotificationForms,
  ReceivedNotificationDto,
  UserAction,
} from './dto/notification.dto';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let mail: MailerService;
  let mockQueue = {
    add: jest.fn(),
    process: jest.fn(),
    on: jest.fn(),
  };

  const promise = new Promise(() => {
    return { to: 'Noah', from: 'Noah', subject: 'email', text: 'text' };
  });

  const receivedNotification: ReceivedNotificationDto = {
    courseId: 'courseId',
    courseName: 'courseName',
    student: 'Noah',
    professor: 'Arrow',
    action: 3,
    actionsType: [
      {
        username: 'Arrow',
        action: [Action.Live_notification, Action.Email],
        email: 'email',
      },
    ],
    acceptAction: true,
  };

  const receivedNotificationStudent: ReceivedNotificationDto = {
    courseId: 'courseId',
    courseName: 'courseName',
    student: 'Noah',
    professor: 'Arrow',
    action: 3,
    actionsType: [
      {
        username: 'Noah',
        action: [Action.Live_notification, Action.Email],
        email: 'email',
      },
    ],
    acceptAction: true,
  };

  const form: FeedbackForm = {
    _id: '',
    dateOfCreation: '',
    name: '',
    openQuestions: [],
    checkQuestions: [],
    multipleQuestions: [],
    responses: 0,
  };

  const notifForms: NotificationForms = {
    action: 5,
    to: '',
    acceptAction: false,
    actionsType: [
      {
        username: 'Noah',
        action: [],
        email: 'email',
      },
    ],
    forms: [form],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationsService, DoneConsumer],
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
    })
      .overrideProvider('done-notifications-queue')
      .useValue({ mockQueue })
      .compile();

    service = module.get<NotificationsService>(NotificationsService);
    mail = module.get<MailerService>(MailerService);

    jest.spyOn(mail, 'sendMail').mockReturnValue(promise);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addNotifications', () => {
    it('creates notifications for different actions from student to professor', async () => {
      const data = jest.spyOn(service, 'storeNotificationInQueue');
      await service.addNotifications([receivedNotification]);
      expect(data).toHaveBeenCalled();
    });

    it('creates notifications for different actions from professor to student', async () => {
      const data = jest.spyOn(service, 'storeNotificationInQueue');
      await service.addNotifications([receivedNotificationStudent]);
      expect(data).toHaveBeenCalled();
    });

    it('fails because the data received is empty', async () => {
      expect(service.addNotifications([])).resolves.toEqual(-1);
    });

    it('does not create the professor notification/email because the actions received are empty', async () => {
      const data = jest.spyOn(service, 'storeNotificationInQueue');
      const data2 = jest.spyOn(service, 'createMail');

      const wrongActions = { ...receivedNotification };
      wrongActions.actionsType = [];

      service.addNotifications([wrongActions]);

      expect(data).not.toHaveBeenCalled();
      expect(data2).not.toHaveBeenCalled();
    });

    it('does not create the student notification/email because the actions received are empty', async () => {
      const data = jest.spyOn(service, 'storeNotificationInQueue');
      const data2 = jest.spyOn(service, 'createMail');

      const wrongActions = { ...receivedNotificationStudent };
      wrongActions.actionsType = [];

      service.addNotifications([wrongActions]);

      expect(data).not.toHaveBeenCalled();
      expect(data2).not.toHaveBeenCalled();
    });
  });

  describe('addNew', () => {
    it('creates one or two notifications for a given action', async () => {
      const data = jest.spyOn(service, 'storeNotificationInQueue');
      await service.addNew(receivedNotification);
      expect(data).toHaveBeenCalled();
    });

    it('fails because the data received is wrong', async () => {
      expect(service.addNew(undefined)).resolves.toEqual(-1);
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

        it('user is not student', () => {
          expect(
            service.createNotificationsText(UserAction.Unregister, '', 'math', false, 'Noah', true)
          ).toEqual('Student Noah has been unregistered in your course: "math"');
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

      describe('incorrect data', () => {
        it('it should return empty text', () => {
          expect(
            service.createNotificationsText(UserAction.SeeDetailsStudent, '', '', true, '', false)
          ).toEqual('');
        });
      });
    });
  });

  describe('addFormNotification', () => {
    it('does not create any form of notification because it is not added to the action types', () => {
      const service1 = jest.spyOn(service, 'storeNotificationInQueue');
      const service2 = jest.spyOn(service, 'createMail');

      service.addFormNotification(notifForms);

      expect(service1).not.toHaveBeenCalled();
      expect(service2).not.toHaveBeenCalled();
    });

    it('sends email notification', () => {
      const service1 = jest.spyOn(service, 'createMail');
      notifForms.actionsType[0].action.push(Action.Email);

      service.addFormNotification(notifForms);

      expect(service1).toHaveBeenCalled();
      notifForms.actionsType[0].action = [];
    });

    it('sends live notification', () => {
      const service1 = jest.spyOn(service, 'storeNotificationInQueue');
      notifForms.actionsType[0].action.push(Action.Live_notification);

      service.addFormNotification(notifForms);

      expect(service1).toHaveBeenCalled();
      notifForms.actionsType[0].action = [];
    });
  });
});
