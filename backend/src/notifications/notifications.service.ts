import { InjectRedis, Redis } from '@nestjs-modules/ioredis';
import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import {
  Action,
  CreatedNotificationDto,
  NotificationState,
  ReceivedNotificationDto,
  UserAction,
} from './dto/notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly mailerService: MailerService
  ) {}

  async addNotifications(data: ReceivedNotificationDto[]): Promise<CreatedNotificationDto[]> {
    if (data.length === 0) return undefined;

    const result: CreatedNotificationDto[] = [];
    for (let element of data) {
      result.push(...(await this.addNew(element)));
    }
    return result;
  }

  /**
   * Creates 2 notifications (one per user) and sends the corresponding emails
   * @param data obtained data from BE
   * @returns array of new notifications
   */
  async addNew(data: ReceivedNotificationDto): Promise<CreatedNotificationDto[]> {
    // Bad request
    if (data.courseId === undefined) return undefined;

    // Result to be send
    const redisResult: CreatedNotificationDto[] = [];

    // ------------------ Student notification ------------------
    // Creating student id and personalized text
    const stuId: string = new Date().getTime().toString(36) + Math.random().toString(36).slice(2);
    const studentText: string = this.createNotificationsText(
      data.action,
      data.courseId,
      true,
      data.studentId,
      data.acceptAction
    );

    // Creating notification to store in Redis
    const newNotificationStudent: CreatedNotificationDto = {
      notificationId: stuId, // Random id
      courseId: data.courseId,
      userId: data.studentId,
      otherUserId: data.professorId,
      action: data.action,
      text: studentText,
      status: NotificationState.New,
    };

    // Storing notification
    const studentActionOptions = data.actionsType.find(user => user.userId === data.studentId);
    if (studentActionOptions?.action.includes(Action.Live_notification)) {
      await this.redis.set(stuId, JSON.stringify(newNotificationStudent));
    }

    // Sending email if this option is active
    if (studentActionOptions?.action.includes(Action.Email)) {
      this.createMail(studentText, data.studentId, studentActionOptions.email);

      // Adding notification to the result
      redisResult.push(JSON.parse(await this.redis.get(stuId)));
    }

    // ------------------ Professor notification ------------------
    // Creating professor id and personalized text
    const profId: string = new Date().getTime().toString(36) + Math.random().toString(36).slice(2);
    const professorText: string = this.createNotificationsText(
      data.action,
      data.courseId,
      false,
      data.studentId,
      data.acceptAction
    );

    // Creating notification to store in Redis
    const newNotificationProfessor: CreatedNotificationDto = {
      notificationId: profId, // Random id
      courseId: data.courseId,
      userId: data.professorId,
      otherUserId: data.studentId,
      action: data.action,
      text: professorText,
      status: NotificationState.New,
    };

    // Storing notification
    const professorActionOptions = data.actionsType.find(user => user.userId === data.professorId);
    if (professorActionOptions?.action.includes(Action.Live_notification)) {
      await this.redis.set(profId, JSON.stringify(newNotificationProfessor));

      // Adding notification to the result
      redisResult.push(JSON.parse(await this.redis.get(profId)));
    }

    // Sending email if this option is active
    if (professorActionOptions?.action.includes(Action.Email)) {
      this.createMail(professorText, data.professorId, professorActionOptions.email);
    }

    // ------------------ Result ------------------
    return redisResult;
  }

  /**
   * Obtains notification in Redis by id and updates status to 'Read'
   * @param notificationIds ids of the notifications to update
   * @returns updatedNotification
   */
  async update(notificationIds: string[]): Promise<void> {
    if (notificationIds.length === 0) return undefined;

    for (let notificationId of notificationIds) {
      const redisData: CreatedNotificationDto = JSON.parse(await this.redis.get(notificationId));
      redisData.status = NotificationState.Read;
      await this.redis.set(notificationId, JSON.stringify(redisData));
    }
  }

  /**
   * Creates the text for the email and/or notification
   * @param action web action / purpose of the notification
   * @param courseId id of the course
   * @param isStudent is student value
   * @param studentId id of the student
   * @param acceptAction boolean to show if the user action is allowed or not
   * @returns Text to fill the email and/or notification
   */
  createNotificationsText(
    action: UserAction,
    courseId: number,
    isStudent: boolean,
    studentId: string,
    acceptAction: boolean
  ): string {
    let textToShow = '';
    switch (action) {
      case UserAction.Register:
        if (isStudent)
          if (acceptAction)
            textToShow = 'You have been registered in a new course with the id: ' + courseId;
          else
            textToShow =
              'You registration request in course with the id: ' + courseId + ' has been rejected';
        else
          textToShow =
            'Student ' + studentId + ' has been registered in your course with id: ' + courseId;
        break;
      case UserAction.ExamStarts:
        if (isStudent) textToShow = 'A new exam will start soon! Course ' + courseId;
        else textToShow = 'Your exam will start soon, From your course: ' + courseId;
        break;
      case UserAction.Unregister:
        if (isStudent) textToShow = 'You have been unregistered in course with the id: ' + courseId;
        else
          textToShow =
            'Student ' + studentId + ' has been unregistered in your course with id: ' + courseId;
        break;
      case UserAction.SeeDetailsStudent:
        if (!isStudent)
          textToShow =
            'Student ' +
            studentId +
            ' has request access to details for your course with id: ' +
            courseId;
        break;
      case UserAction.SeeDetailsProfessorAction:
        if (isStudent)
          if (acceptAction)
            textToShow =
              'You have been granted access to details for course with the id: ' + courseId;
          else
            textToShow =
              'Your access request in course with the id: ' + courseId + ' has been rejected';
        break;
    }

    return textToShow;
  }

  /**
   * Creation of the email
   * @param textToShow text to show in the email
   * @param userId user to send the notification to
   * @param email user email
   */
  createMail(textToShow: string, userId: string, email: string): void {
    this.mailerService
      .sendMail({
        to: 'academinimailtest@gmail.com', // to: email
        from: 'academinimailtest@gmail.com', // from ?
        subject: 'You (id: ' + userId + ') have 1 new notification ✔',
        template: 'notification', // The `.pug`, `.ejs` or `.hbs` extension is appended automatically.
        context: {
          text: textToShow,
        },
      })
      .then(() => {})
      .catch(() => {});
  }
}
