import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { LogsModule } from '../logs/logs.module';
import { CustomerConsent } from './entities/customer-consent.entity';
import { CommunicationPreference } from './entities/communication-preference.entity';
import { ConsentEvent } from './entities/consent-event.entity';
import { ConsentRequest } from './entities/consent-request.entity';
import { CommunicationConsentsService } from './communication-consents.service';
import { CommunicationEligibilityService } from './communication-eligibility.service';
import { CommunicationConsentsController } from './communication-consents.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            User,
            CustomerConsent,
            CommunicationPreference,
            ConsentEvent,
            ConsentRequest,
        ]),
        LogsModule,
    ],
    controllers: [CommunicationConsentsController],
    providers: [CommunicationConsentsService, CommunicationEligibilityService],
    exports: [CommunicationConsentsService, CommunicationEligibilityService],
})
export class CommunicationConsentsModule {}
