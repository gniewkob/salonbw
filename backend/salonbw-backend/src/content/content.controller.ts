import { Controller, Get, Param, Query } from '@nestjs/common';
import { ContentService } from './content.service';

@Controller('content')
export class ContentController {
    constructor(private readonly contentService: ContentService) {}

    @Get('sections')
    async getAllSections(@Query('active') active?: string) {
        const isActive = active === 'true' ? true : undefined;
        return this.contentService.getAllSections(isActive);
    }

    @Get('sections/:key')
    async getSectionByKey(@Param('key') key: string) {
        return this.contentService.getSectionByKey(key);
    }
}
