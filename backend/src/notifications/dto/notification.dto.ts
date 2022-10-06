enum Action {
  Email,
  Live_notification,
}

export enum NotificationState {
  New,
  Read,
}

export class NotificationDto {
  // TODO: choose number or string
  notificationId?: number;
  courseId: number | string;
  studentId: number | string;
  professorId: number | string;
  status: NotificationState;
  actionType: Action[];
}
