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
  acceptAction: boolean;
}

export class CreatedNotificationDto {
  notificationId: string;
  courseId: number;
  userId: string;
  otherUserId: string;
  action: UserAction;
  status: NotificationState;
  text: string;
}
