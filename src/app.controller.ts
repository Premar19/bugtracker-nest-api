import { Controller, Get } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { AppService } from './app.service';

/**
 * Liveness check. Excluded from the OpenAPI docs so that /api shows the API
 * itself rather than leading with a scaffolded hello-world route.
 */
@ApiExcludeController()
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
