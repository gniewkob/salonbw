import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Request,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Controller('reviews')
export class ReviewsController {
    constructor(private readonly service: ReviewsService) {}

    @Get()
    list() {
        return this.service.findAll();
    }

    @Get(':id')
    get(@Param('id') id: number) {
        return this.service.findOne(Number(id));
    }

    @Post()
    create(@Body() dto: CreateReviewDto, @Request() req) {
        return this.service.create(dto, req.user.id);
    }

    @Patch(':id')
    update(@Param('id') id: number, @Body() dto: UpdateReviewDto) {
        return this.service.update(Number(id), dto);
    }

    @Delete(':id')
    remove(@Param('id') id: number) {
        return this.service.remove(Number(id));
    }
}
