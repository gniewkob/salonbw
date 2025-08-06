import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator';
import { InstagramService } from './instagram.service';

@ApiTags('Gallery')
@Controller('gallery')
export class GalleryController {
    constructor(private readonly instagram: InstagramService) {}

    @Get()
    @Public()
    @ApiOperation({ summary: 'Get gallery posts' })
    @ApiResponse({ status: 200 })
    getGallery(@Query('count') count = '9') {
        const num = parseInt(count, 10) || 9;
        return this.instagram.fetchLatestPosts(num);
    }
}
