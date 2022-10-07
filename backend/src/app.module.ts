import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisModule } from '@nestjs-modules/ioredis';
import { NotificationsModule } from './notifications/notifications.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { EjsAdapter } from '@nestjs-modules/mailer/dist/adapters/ejs.adapter';
@Module({
  imports: [
    NotificationsModule,
    RedisModule.forRoot({
      config: {
        host: 'localhost',
        port: 6360,
      },
    }),
    MailerModule.forRoot({
      transport: {
        host: 'smtp.gmail.com',
        port: 465,
        // ignoreTLS: true,
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
      preview: true,
      template: {
        dir: process.cwd() + '/template/',
        adapter: new EjsAdapter(),
        options: {
          strict: true,
        },
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
