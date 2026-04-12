import {
    Body,
    BadRequestException,
    Controller,
    Delete,
    Get,
    StreamableFile,
    Param,
    ParseIntPipe,
    Post,
    Put,
    Query,
    Req,
    Res,
    UseGuards,
    UseInterceptors,
    UploadedFiles,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiQuery,
    ApiTags,
} from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { createReadStream } from 'node:fs';
import type { Request as ExpressRequest, Response } from 'express';
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
    @Post(':id/photos/upload')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Upload service photo file' })
    @UseInterceptors(
        FileFieldsInterceptor(
            [
                { name: 'image', maxCount: 1 },
                { name: 'Filedata', maxCount: 1 },
            ],
            {
                storage: diskStorage({
                    destination: (
                        req: ExpressRequest,
                        _file: Express.Multer.File,
                        cb: (error: Error | null, destination: string) => void,
                    ) => {
                        const root =
                            (process.env.UPLOADS_DIR || '').trim() ||
                            path.join(process.cwd(), 'uploads');
                        const rawId = req.params?.id;
                        const serviceId = Number(rawId);
                        if (!Number.isInteger(serviceId) || serviceId <= 0) {
                            return cb(new Error('Invalid serviceId'), root);
                        }
                        const dir = path.join(
                            root,
                            'services',
                            String(serviceId),
                            'gallery',
                        );
                        fs.mkdirSync(dir, { recursive: true });
                        cb(null, dir);
                    },
                    filename: (
                        req: ExpressRequest & { __servicePhotoName?: string },
                        file: Express.Multer.File,
                        cb: (error: Error | null, filename: string) => void,
                    ) => {
                        const ext = path
                            .extname(file.originalname || '')
                            .toLowerCase()
                            .slice(0, 10);
                        const name = `${uuidv4()}${ext || ''}`;
                        req.__servicePhotoName = name;
                        cb(null, name);
                    },
                }),
                limits: { fileSize: 10 * 1024 * 1024 },
            },
        ),
    )
    async uploadPhotoFile(
        @Param('id', ParseIntPipe) id: number,
        @Req()
        req: ExpressRequest & { __servicePhotoName?: string; user?: unknown },
        @UploadedFiles()
        files:
            | {
                  image?: Express.Multer.File[];
                  Filedata?: Express.Multer.File[];
              }
            | undefined,
        @Body('caption') caption?: string,
        @Body('sortOrder') sortOrderRaw?: string,
        @Body('isPublic') isPublicRaw?: string,
        @Body('gallery_id') galleryIdRaw?: string,
    ) {
        const file = files?.Filedata?.[0] ?? files?.image?.[0];
        if (!file) {
            throw new Error('No image uploaded');
        }
        if (galleryIdRaw && galleryIdRaw.trim().length > 0) {
            const galleryId = Number(galleryIdRaw);
            if (!Number.isInteger(galleryId) || galleryId <= 0) {
                throw new BadRequestException('Invalid gallery_id');
            }
            if (galleryId !== id) {
                throw new BadRequestException(
                    'gallery_id must match service scope',
                );
            }
        }
        const storedName = String(req.__servicePhotoName || file.filename);
        const relPath = path.join(
            'services',
            String(id),
            'gallery',
            storedName,
        );
        const sortOrder =
            sortOrderRaw && sortOrderRaw.trim().length > 0
                ? Number(sortOrderRaw)
                : undefined;
        const isPublic =
            isPublicRaw && isPublicRaw.trim().length > 0
                ? isPublicRaw === 'true' || isPublicRaw === '1'
                : undefined;

        return this.detailsService.addUploadedPhoto(id, {
            storedRelativePath: relPath,
            mimeType: file.mimetype,
            size: file.size,
            caption,
            sortOrder: Number.isFinite(sortOrder) ? sortOrder : undefined,
            isPublic,
        });
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin, Role.Receptionist)
    @Get(':id/photos/:photoId/file')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get service photo file' })
    async getPhotoFile(
        @Param('id', ParseIntPipe) id: number,
        @Param('photoId', ParseIntPipe) photoId: number,
        @Res({ passthrough: true }) res: Response,
    ) {
        const { fullPath, mimeType } = await this.detailsService.getPhotoFile(
            id,
            photoId,
        );
        res.setHeader('Content-Type', mimeType);
        return new StreamableFile(createReadStream(fullPath));
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
