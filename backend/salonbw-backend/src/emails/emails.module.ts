import { Module } from '@nestjs/common';
import { EmailsService } from './emails.service';
import { EmailsController } from './emails.controller';
import { ObservabilityModule } from '../observability/observability.module';

@Module({
    imports: [ObservabilityModule],
    controllers: [EmailsController],
    providers: [EmailsService],
})
export class EmailsModule {}
