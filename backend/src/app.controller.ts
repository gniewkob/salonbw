import { ApiErrorResponses } from './common/decorators/api-error-responses.decorator';
import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiOkResponse } from '@nestjs/swagger';
import { Public } from './auth/public.decorator';
import { AppService } from './app.service';

@ApiTags('App')
@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {}

    @Get()
    @Public()
    @ApiOperation({ summary: 'Get greeting message' })
    @ApiOkResponse({
        description: 'Greeting returned by the service',
        schema: {
            type: 'string',
            example: 'Hello World!',
        },
    })
    @ApiErrorResponses()
    getHello(): string {
        return this.appService.getHello();
    }
}
