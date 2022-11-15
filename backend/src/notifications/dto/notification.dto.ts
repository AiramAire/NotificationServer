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
  SendForms,
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

export class FeedbackForm {
  _id: string;
  dateOfCreation: string;
  name: string;
  openQuestions: Question[];
  checkQuestions: Question[];
  multipleQuestions: Question[];
  responses: number;
}

export interface Question {
  question: string;
  options?: string[];
  response?: UserResponses;
}

export interface UserResponses {
  userId: string;
  responses: string[];
}

export class NotificationForms {
  action: UserAction;
  to: string;
  acceptAction: boolean;
  actionsType: ActionPerUser[];
  forms: FeedbackForm[];
}
