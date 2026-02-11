import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Query,
    UseGuards,
    ParseIntPipe,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
    ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '../users/role.enum';
import { ReviewsService, PaginatedResult } from './reviews.service';
import { Review } from './review.entity';
import { User } from '../users/user.entity';

class CreateReviewDto {
    @IsInt()
    employeeId: number;

    @IsInt()
    @Min(1)
    @Max(5)
    rating: number;

    @IsString()
    @IsOptional()
    comment?: string;
}

@ApiTags('reviews')
@Controller()
export class ReviewsController {
    constructor(private readonly reviewsService: ReviewsService) {}

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @Get('reviews')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'List all reviews (admin only)' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({ status: 200 })
    findAll(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ): Promise<PaginatedResult<Review>> {
        return this.reviewsService.findAll(
            page ? parseInt(page, 10) : 1,
            limit ? parseInt(limit, 10) : 10,
        );
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Client, Role.Employee, Role.Admin)
    @Get('reviews/me')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get reviews for current user' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({ status: 200 })
    findMine(
        @CurrentUser() user: { userId: number },
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ): Promise<PaginatedResult<Review>> {
        return this.reviewsService.findForClient(
            user.userId,
            page ? parseInt(page, 10) : 1,
            limit ? parseInt(limit, 10) : 10,
        );
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Client, Role.Employee, Role.Admin)
    @Get('customers/:id/reviews')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get reviews for a customer' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({ status: 200 })
    findForCustomer(
        @Param('id', ParseIntPipe) customerId: number,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ): Promise<PaginatedResult<Review>> {
        return this.reviewsService.findForClient(
            customerId,
            page ? parseInt(page, 10) : 1,
            limit ? parseInt(limit, 10) : 10,
        );
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Client, Role.Employee, Role.Admin)
    @Get('employees/:id/reviews')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get reviews for an employee' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({ status: 200 })
    findForEmployee(
        @Param('id', ParseIntPipe) employeeId: number,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ): Promise<PaginatedResult<Review>> {
        return this.reviewsService.findForEmployee(
            employeeId,
            page ? parseInt(page, 10) : 1,
            limit ? parseInt(limit, 10) : 10,
        );
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Client)
    @Post('reviews')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a review' })
    @ApiResponse({ status: 201, type: Review })
    async create(
        @Body() dto: CreateReviewDto,
        @CurrentUser() user: { userId: number },
    ): Promise<Review> {
        if (dto.rating < 1 || dto.rating > 5) {
            throw new BadRequestException('Rating must be between 1 and 5');
        }
        return this.reviewsService.create({
            client: { id: user.userId } as User,
            employee: { id: dto.employeeId } as User,
            rating: dto.rating,
            comment: dto.comment,
        });
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Client, Role.Admin)
    @Delete('reviews/:id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete a review' })
    @ApiResponse({ status: 200 })
    async delete(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: { userId: number; role: Role },
    ): Promise<{ success: boolean }> {
        const review = await this.reviewsService.findOne(id);
        if (!review) {
            throw new NotFoundException();
        }
        // Non-admins can only delete their own reviews
        if (user.role !== Role.Admin && review.client.id !== user.userId) {
            throw new ForbiddenException();
        }
        await this.reviewsService.delete(id);
        return { success: true };
    }
}
