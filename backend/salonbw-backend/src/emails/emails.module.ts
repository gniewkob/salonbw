import { CommunicationConsentsModule } from '../communication-consents/communication-consents.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailsService } from './emails.service';
import { EmailsController } from './emails.controller';
import { ObservabilityModule } from '../observability/observability.module';
import { EmailLog } from './email-log.entity';
import { User } from '../users/user.entity';

@Module({
    imports: [
        ObservabilityModule,
        TypeOrmModule.forFeature([EmailLog, User]),
        CommunicationConsentsModule,
    ],
    controllers: [EmailsController],
    providers: [EmailsService],
    exports: [EmailsService],
})
export class EmailsModule {}
