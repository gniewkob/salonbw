import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Post,
    Put,
    Query,
    UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiQuery,
    ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '../users/role.enum';
import { ServiceDetailsService } from './service-details.service';
import {
    CreateServiceMediaDto,
    CreateServiceReviewDto,
    ServiceHistoryQueryDto,
    ServiceStatsQueryDto,
    UpdateServiceCommissionsDto,
    UpdateServiceRecipeDto,
} from './dto/service-details.dto';
import { ServiceReviewSource } from './entities/service-review.entity';

@ApiTags('services')
@Controller('services')
export class ServiceDetailsController {
    constructor(private readonly detailsService: ServiceDetailsService) {}

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin, Role.Receptionist)
    @Get(':id/summary')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get service summary (details view)' })
    summary(@Param('id', ParseIntPipe) id: number) {
        return this.detailsService.getSummary(id);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin, Role.Receptionist)
    @Get(':id/stats')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get service stats' })
    stats(
        @Param('id', ParseIntPipe) id: number,
        @Query() query: ServiceStatsQueryDto,
    ) {
        return this.detailsService.getStats(
            id,
            query.from,
            query.to,
            query.groupBy as 'day' | 'week' | 'month',
        );
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin, Role.Receptionist)
    @Get(':id/history')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get service history (appointments)' })
    history(
        @Param('id', ParseIntPipe) id: number,
        @Query() query: ServiceHistoryQueryDto,
    ) {
        return this.detailsService.getHistory(
            id,
            query.page ?? 1,
            query.limit ?? 20,
            query.from,
            query.to,
        );
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin, Role.Receptionist)
    @Get(':id/employees')
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Get employees assigned to service (incl. variants)',
    })
    employees(@Param('id', ParseIntPipe) id: number) {
        return this.detailsService.getEmployees(id);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin, Role.Receptionist)
    @Get(':id/comments')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get service comments (reviews)' })
    @ApiQuery({ name: 'source', required: false, enum: ServiceReviewSource })
    comments(
        @Param('id', ParseIntPipe) id: number,
        @Query('source') source?: ServiceReviewSource,
    ) {
        return this.detailsService.getComments(id, source);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin, Role.Receptionist)
    @Post(':id/comments')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Add service comment' })
    addComment(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: CreateServiceReviewDto,
    ) {
        return this.detailsService.addComment(id, body);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin, Role.Receptionist)
    @Delete(':id/comments/:commentId')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete service comment' })
    deleteComment(
        @Param('id', ParseIntPipe) id: number,
        @Param('commentId', ParseIntPipe) commentId: number,
    ) {
        return this.detailsService.deleteComment(id, commentId);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin, Role.Receptionist)
    @Get(':id/photos')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get service photos' })
    photos(@Param('id', ParseIntPipe) id: number) {
        return this.detailsService.getPhotos(id);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin, Role.Receptionist)
    @Post(':id/photos')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Add service photo' })
    addPhoto(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: CreateServiceMediaDto,
    ) {
        return this.detailsService.addPhoto(id, body);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin, Role.Receptionist)
    @Delete(':id/photos/:photoId')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete service photo' })
    deletePhoto(
        @Param('id', ParseIntPipe) id: number,
        @Param('photoId', ParseIntPipe) photoId: number,
    ) {
        return this.detailsService.deletePhoto(id, photoId);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin, Role.Receptionist)
    @Get(':id/recipe')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get service recipe items' })
    recipe(@Param('id', ParseIntPipe) id: number) {
        return this.detailsService.getRecipe(id);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin, Role.Receptionist)
    @Put(':id/recipe')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Replace service recipe items' })
    updateRecipe(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: UpdateServiceRecipeDto,
    ) {
        return this.detailsService.replaceRecipe(id, body.items ?? []);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin, Role.Receptionist)
    @Get(':id/commissions')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get service commission rules' })
    commissions(@Param('id', ParseIntPipe) id: number) {
        return this.detailsService.getCommissions(id);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin, Role.Receptionist)
    @Put(':id/commissions')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Replace service commission rules' })
    updateCommissions(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: UpdateServiceCommissionsDto,
    ) {
        return this.detailsService.replaceCommissions(id, body.rules ?? []);
    }
}
