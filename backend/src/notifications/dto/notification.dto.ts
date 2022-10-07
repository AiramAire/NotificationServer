export enum Action {
  Email,
  Live_notification,
}

export enum UserAction {
  Register,
  ExamStarts,
  Unregister,
  SeeDetails,
}

export enum NotificationState {
  New,
  Read,
}

export class ActionPerUser {
  userId: string;
  action: Action[];
  email?: string;
}

export class ReceivedNotificationDto {
  courseId: number;
  studentId: string;
  professorId: string;
  action: UserAction;
  actionsType: ActionPerUser[];
}

export class CreatedNotificationDto {
  notificationId: string;
  courseId: number;
  userId: string;
  status: NotificationState;
  text: string;
}
