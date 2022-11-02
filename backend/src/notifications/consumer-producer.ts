import { Processor, Process, OnGlobalQueueActive, InjectQueue } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { NotificationsService } from './notifications.service';

@Processor('create-notifications-queue')
export class CreateConsumer {
  constructor(
    @InjectQueue('create-notifications-queue') private createQueue: Queue,
    public notificationService: NotificationsService
  ) {}

  @OnGlobalQueueActive()
  async onActive(jobId: number) {
    const job = await this.createQueue.getJob(jobId);
    this.notificationService.addNotifications(job.data.notifications);
  }
}

@Processor('done-notifications-queue')
export class DoneConsumer {
  @Process('doneNotifications')
  async doneNotifications(job: Job) {
    // This process sends the created notification to the backend
  }
}
