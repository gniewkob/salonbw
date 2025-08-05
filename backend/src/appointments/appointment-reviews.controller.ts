import {
    Body,
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Post,
    Request,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../users/role.enum';
import { ReviewsService } from '../reviews/reviews.service';
import { CreateAppointmentReviewDto } from './dto/create-appointment-review.dto';

@ApiTags('Appointments')
@ApiBearerAuth()
@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppointmentReviewsController {
    constructor(private readonly reviews: ReviewsService) {}

    @Post(':id/review')
    @Roles(Role.Client)
    @ApiOperation({ summary: 'Create review for appointment' })
    @ApiResponse({ status: 201 })
    create(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: CreateAppointmentReviewDto,
        @Request() req,
    ) {
        return this.reviews.create(
            { ...dto, appointmentId: id },
            req.user.id,
        );
    }

    @Get(':id/review')
    @Roles(Role.Client)
    @ApiOperation({ summary: 'Get review for appointment' })
    @ApiResponse({ status: 200 })
    find(@Param('id', ParseIntPipe) id: number) {
        return this.reviews.findByAppointment(id);
    }
}
