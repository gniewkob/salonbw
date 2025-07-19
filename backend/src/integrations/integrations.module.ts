import { Module } from '@nestjs/common';
import { InstagramService } from './instagram.service';
import { GalleryController } from './gallery.controller';

@Module({
    providers: [InstagramService],
    controllers: [GalleryController],
    exports: [InstagramService],
})
export class IntegrationsModule {}
