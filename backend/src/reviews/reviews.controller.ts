import { ApiErrorResponses } from '../common/decorators/api-error-responses.decorator';
import { Controller, Delete, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../users/role.enum';
import { ReviewsService } from './reviews.service';

@ApiTags('Reviews')
@ApiBearerAuth()
@Controller('reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
export class ReviewsController {
    constructor(private readonly service: ReviewsService) {}

    @Delete(':id')
    @ApiOperation({ summary: 'Delete review' })
    @ApiResponse({ status: 200 })
    @ApiErrorResponses()
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.service.remove(id);
    }
}
