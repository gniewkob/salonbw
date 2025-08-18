import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WhatsappService } from './whatsapp.service';

@Module({
    imports: [HttpModule],
    providers: [WhatsappService],
    exports: [WhatsappService],
})
export class NotificationsModule {}
