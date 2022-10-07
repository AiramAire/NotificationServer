import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Transport, ClientProxy, ClientProxyFactory } from '@nestjs/microservices';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  async getHello(): Promise<string> {
    return this.appService.getHello();
  }
}
