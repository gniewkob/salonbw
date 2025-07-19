import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailsController } from './emails.controller';
import { EmailsService } from './emails.service';
import { EmailLog } from './email-log.entity';
import { EmailOptOut } from './email-optout.entity';

@Module({
    imports: [TypeOrmModule.forFeature([EmailLog, EmailOptOut])],
    controllers: [EmailsController],
    providers: [EmailsService],
    exports: [EmailsService],
})
export class EmailsModule {}
