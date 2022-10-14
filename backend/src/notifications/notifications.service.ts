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
   * Creates the notifications calling the auxiliar method "addNew"
   * @param data notification array received
   * @returns
   */
  async addNotifications(data: ReceivedNotificationDto[]): Promise<CreatedNotificationDto[]> {
    if (data.length === 0) return undefined;

    const result: CreatedNotificationDto[] = [];
    for (let element of data) {
      result.push(...(await this.addNew(element)));
    }

    return result;
  }

  /**
   * Creates 1 or 2 notifications (per user) and sends the corresponding emails
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
      data.courseName,
      true,
      data.student,
      data.acceptAction
    );

    // Creating notification to store in Redis
    const newNotificationStudent: CreatedNotificationDto = {
      notificationId: stuId, // Random id
      courseId: data.courseId,
      courseName: data.courseName,
      username: data.student,
      otherUser: data.professor,
      action: data.action,
      text: studentText,
      status: NotificationState.New,
    };

    // Storing notification
    const studentActionOptions = data.actionsType.find(user => user.username === data.student);
    if (studentActionOptions?.action.includes(Action.Live_notification)) {
      await this.redis.set(stuId, JSON.stringify(newNotificationStudent));
    }

    // Sending email if this option is active
    if (studentActionOptions?.action.includes(Action.Email)) {
      this.createMail(studentText, data.student, studentActionOptions.email);

      // Adding notification to the result
      redisResult.push(JSON.parse(await this.redis.get(stuId)));
    }

    // ------------------ Professor notification ------------------
    // Creating professor id and personalized text
    const profId: string = new Date().getTime().toString(36) + Math.random().toString(36).slice(2);
    const professorText: string = this.createNotificationsText(
      data.action,
      data.courseId,
      data.courseName,
      false,
      data.student,
      data.acceptAction
    );

    // Creating notification to store in Redis
    const newNotificationProfessor: CreatedNotificationDto = {
      notificationId: profId, // Random id
      courseId: data.courseId,
      courseName: data.courseName,
      username: data.professor,
      otherUser: data.student,
      action: data.action,
      text: professorText,
      status: NotificationState.New,
    };

    // Storing notification
    const professorActionOptions = data.actionsType.find(user => user.username === data.professor);
    if (professorActionOptions?.action.includes(Action.Live_notification)) {
      await this.redis.set(profId, JSON.stringify(newNotificationProfessor));

      // Adding notification to the result
      redisResult.push(JSON.parse(await this.redis.get(profId)));
    }

    // Sending email if this option is active
    if (professorActionOptions?.action.includes(Action.Email)) {
      this.createMail(professorText, data.professor, professorActionOptions.email);
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
   * @param courseName name of the course
   * @param isStudent is student value
   * @param student id of the student
   * @param acceptAction boolean to show if the user action is allowed or not
   * @returns Text to fill the email and/or notification
   */
  createNotificationsText(
    action: UserAction,
    courseId: string, // In case it could be needed
    courseName: string,
    isStudent: boolean,
    student: string,
    acceptAction: boolean
  ): string {
    let textToShow = '';
    switch (action) {
      // TODO: Not implemented yet
      case UserAction.Register:
        if (isStudent)
          textToShow = acceptAction
            ? 'You have been registered in a new course: "' + courseName + '"'
            : 'Your registration request in course: "' + courseName + '" has been rejected';
        else
          textToShow =
            'Student ' + student + ' has been registered in your course: "' + courseName + '"';
        break;
      // TODO: Not implemented yet and there are no future plans to do so
      // case UserAction.ExamStarts:
      //   textToShow = isStudent
      //     ? 'A new exam will start soon! Course: ' + courseName + ' (id: ' + courseId + ')'
      //     : 'Your exam will start soon, From your course: ' +
      //       courseName +
      //       ' (id: ' +
      //       courseId +
      //       ')';
      //   break;
      // TODO: Not implemented yet
      case UserAction.Unregister:
        textToShow = isStudent
          ? 'You have been unregistered in course: "' + courseName + '"'
          : 'Student ' + student + ' has been unregistered in your course: "' + courseName + '"';
        break;
      case UserAction.SeeDetailsStudent:
        if (!isStudent)
          textToShow =
            'Student ' +
            student +
            ' has request access to details for your course: "' +
            courseName +
            '"';
        break;
      case UserAction.SeeDetailsProfessorAction:
        textToShow =
          acceptAction && isStudent
            ? 'You have been granted access to details for course: "' + courseName + '"'
            : 'Your access request in course "' + courseName + '" has been rejected';
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
  createMail(textToShow: string, username: string, email: string): void {
    this.mailerService
      .sendMail({
        to: 'academinimailtest@gmail.com', // to: email
        from: 'academinimailtest@gmail.com', // from ?
        subject: 'Hi ' + username + ', you have 1 new notification ✔',
        template: 'notification', // The `.pug`, `.ejs` or `.hbs` extension is appended automatically.
        context: {
          text: textToShow,
        },
      })
      .then(() => {})
      .catch(() => {});
  }
}
