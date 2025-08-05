import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ReviewsService } from '../reviews/reviews.service';

@ApiTags('Employees')
@Controller('employees')
export class EmployeeReviewsController {
    constructor(private readonly reviews: ReviewsService) {}

    @Get(':id/reviews')
    @ApiOperation({ summary: 'List reviews for employee' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'rating', required: false })
    @ApiResponse({ status: 200 })
    list(
        @Param('id', ParseIntPipe) id: number,
        @Query('page') page = '1',
        @Query('limit') limit = '10',
        @Query('rating') rating?: string,
    ) {
        return this.reviews.findEmployeeReviews(
            id,
            Number(page),
            Number(limit),
            rating ? Number(rating) : undefined,
        );
    }
}
