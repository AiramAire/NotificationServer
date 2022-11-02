export enum Action {
  Email,
  Live_notification,
}

export enum UserAction {
  Register,
  ExamStarts,
  Unregister,
  SeeDetailsStudent,
  SeeDetailsProfessorAction,
}

export enum NotificationState {
  New,
  Read,
}

export class ActionPerUser {
  username: string;
  action: Action[];
  email?: string;
}

export class ReceivedNotificationDto {
  courseId: string;
  courseName: string;
  student: string;
  professor: string;
  action: UserAction;
  actionsType: ActionPerUser[];
  acceptAction: boolean;
}

export class CreatedNotificationDto {
  notificationId: string;
  courseId: string;
  courseName: string;
  from: string;
  to: string;
  action: UserAction;
  status: NotificationState;
  text: string;
}
