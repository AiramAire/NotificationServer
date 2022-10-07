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

  /**
   * Creates 2 notifications (one per user) and sends the corresponding emails
   * @param data obtained data from BE
   * @returns array of new notifications
   */
  async addNew(data: ReceivedNotificationDto): Promise<CreatedNotificationDto[]> {
    const redisResult: CreatedNotificationDto[] = [];

    // ------------------ Student notification ------------------
    // Creating student id and personalized text
    const stuId: string = new Date().getTime().toString(36) + Math.random().toString(36).slice(2);
    const studentText: string = this.createNotificationsText(
      data.action,
      data.courseId,
      true,
      data.studentId
    );

    // Creating notification to store in Redis
    const newNotificationStudent: CreatedNotificationDto = {
      notificationId: stuId, // Random id
      courseId: data.courseId,
      userId: data.studentId,
      text: studentText,
      status: NotificationState.New,
    };

    // Storing notification
    await this.redis.set(stuId, JSON.stringify(newNotificationStudent));

    // Sending email if this option is active
    const studentActionOptions = data.actionsType.find(user => user.userId === data.studentId);
    if (studentActionOptions.action.includes(Action.Email)) {
      this.createMail(studentText, data.studentId, studentActionOptions.email);
    }

    // Adding notification to the result
    redisResult.push(JSON.parse(await this.redis.get(stuId)));

    // ------------------ Professor notification ------------------
    // Creating professor id and personalized text
    const profId: string = new Date().getTime().toString(36) + Math.random().toString(36).slice(2);
    const professorText: string = this.createNotificationsText(
      data.action,
      data.courseId,
      false,
      data.studentId
    );

    // Creating notification to store in Redis
    const newNotificationProfessor: CreatedNotificationDto = {
      notificationId: profId, // Random id
      courseId: data.courseId,
      userId: data.professorId,
      text: professorText,
      status: NotificationState.New,
    };

    // Storing notification
    await this.redis.set(profId, JSON.stringify(newNotificationProfessor));

    // Sending email if this option is active
    const professorActionOptions = data.actionsType.find(user => user.userId === data.professorId);
    if (professorActionOptions.action.includes(Action.Email)) {
      this.createMail(professorText, data.professorId, professorActionOptions.email);
    }

    // Adding notification to the result
    redisResult.push(JSON.parse(await this.redis.get(profId)));

    // ------------------ Result ------------------
    return redisResult;
  }

  /**
   * Obtains notification in Redis by id and updates status to 'Read'
   * @param notificationId id of the notification to update
   * @returns updatedNotification -> TODO: Or nothing?
   */
  async update(notificationId: string): Promise<CreatedNotificationDto> {
    const redisData = JSON.parse(await this.redis.get(notificationId));
    redisData.status = NotificationState.Read;
    await this.redis.set(notificationId, JSON.stringify(redisData));
    const redisDataUpdated = await this.redis.get(notificationId);
    return JSON.parse(redisDataUpdated);
  }

  /**
   * Creates the text for the email and/or notification
   * @param action web action / purpose of the notification
   * @param courseId id of the course
   * @param isStudent is student value
   * @param studentId id of the student
   * @returns Text to fill the email and/or notification
   */
  createNotificationsText(
    action: UserAction,
    courseId: number,
    isStudent: boolean,
    studentId: string
  ): string {
    let textToShow = '';
    switch (action) {
      case UserAction.Register:
        if (isStudent)
          textToShow = 'You have been registered in a new course with the id: ' + courseId;
        else
          textToShow =
            'Student ' + studentId + ' has been registered in your course with id: ' + courseId;
        break;
      case UserAction.ExamStarts:
        if (isStudent) textToShow = 'A new exam will start soon! Course ' + courseId;
        else textToShow = 'Your exam will start soon, From your course: ' + courseId;
        break;
      case UserAction.Unregister:
        if (isStudent) textToShow = 'You haveen unregistered in course with the id: ' + courseId;
        else
          textToShow =
            'Student ' + studentId + ' has been unregistered in your course with id: ' + courseId;
        break;
      case UserAction.SeeDetails:
        if (isStudent)
          textToShow = 'You have request access to details for course with the id: ' + courseId;
        else
          textToShow =
            'Student ' +
            studentId +
            ' has request access to details for your course with id: ' +
            courseId;
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
