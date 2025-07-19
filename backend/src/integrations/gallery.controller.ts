import { Controller, Get, Query } from '@nestjs/common';
import { InstagramService } from './instagram.service';

@Controller('gallery')
export class GalleryController {
    constructor(private readonly instagram: InstagramService) {}

    @Get()
    getGallery(@Query('count') count = '9') {
        const num = parseInt(count, 10) || 9;
        return this.instagram.fetchLatestPosts(num);
    }
}
