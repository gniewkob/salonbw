import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';
import { AppService } from './app.service';

@ApiTags('app')
@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {}

    @Get()
    @ApiOperation({ summary: 'Root endpoint' })
    @ApiResponse({ status: 200, description: 'Hello world message' })
    getHello(): string {
        return this.appService.getHello();
    }

    @Get('debug-logs')
    getLogs(): string {
        try {
            const logPath = path.join(process.cwd(), 'app.log');
            if (fs.existsSync(logPath)) {
                return fs.readFileSync(logPath, 'utf8');
            }
            return `Log file not found at ${logPath}`;
        } catch (e) {
            return `Error reading logs: ${e}`;
        }
    }
}
