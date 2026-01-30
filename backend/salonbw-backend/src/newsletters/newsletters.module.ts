import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Newsletter } from './entities/newsletter.entity';
import { NewsletterRecipient } from './entities/newsletter-recipient.entity';
import { User } from '../users/user.entity';
import { NewslettersService } from './newsletters.service';
import { NewslettersController } from './newsletters.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([Newsletter, NewsletterRecipient, User]),
    ],
    controllers: [NewslettersController],
    providers: [NewslettersService],
    exports: [NewslettersService],
})
export class NewslettersModule {}
