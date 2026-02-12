import {
    Body,
    Controller,
    Delete,
    Get,
    StreamableFile,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Put,
    Query,
    Req,
    Res,
    UseGuards,
    UseInterceptors,
    UploadedFile,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '../users/role.enum';
import { CustomersService } from './customers.service';
import { CustomerStatisticsService } from './customer-statistics.service';
import { CustomerMediaService } from './customer-media.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { createReadStream } from 'node:fs';
import type { Request as ExpressRequest, Response } from 'express';
import {
    CustomerFilterDto,
    CreateCustomerDto,
    UpdateCustomerDto,
} from './dto/customer-filter.dto';
import {
    CreateCustomerGroupDto,
    UpdateCustomerGroupDto,
    AddMembersDto,
} from './dto/customer-group.dto';
import {
    CreateCustomerNoteDto,
    UpdateCustomerNoteDto,
} from './dto/customer-note.dto';
import {
    CreateCustomerTagDto,
    UpdateCustomerTagDto,
    AssignTagsDto,
} from './dto/customer-tag.dto';

@ApiTags('customers')
@Controller('customers')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CustomersController {
    constructor(
        private readonly customersService: CustomersService,
        private readonly statisticsService: CustomerStatisticsService,
        private readonly mediaService: CustomerMediaService,
    ) {}

    // ==================== CUSTOMERS ====================

    @Get()
    @Roles(Role.Admin, Role.Employee, Role.Receptionist)
    @ApiOperation({ summary: 'List customers with filters' })
    list(@Query() filter: CustomerFilterDto) {
        return this.customersService.findAll(filter);
    }

    @Get(':id')
    @Roles(Role.Admin, Role.Employee, Role.Receptionist)
    @ApiOperation({ summary: 'Get customer by ID' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.customersService.findOne(id);
    }

    @Post()
    @Roles(Role.Admin, Role.Employee, Role.Receptionist)
    @ApiOperation({ summary: 'Create new customer' })
    @ApiResponse({ status: 201 })
    create(@Body() dto: CreateCustomerDto) {
        return this.customersService.create(dto);
    }

    @Put(':id')
    @Roles(Role.Admin, Role.Employee, Role.Receptionist)
    @ApiOperation({ summary: 'Update customer' })
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateCustomerDto,
    ) {
        return this.customersService.update(id, dto);
    }

    // ==================== STATISTICS ====================

    @Get(':id/statistics')
    @Roles(Role.Admin, Role.Employee, Role.Receptionist)
    @ApiOperation({ summary: 'Get customer statistics' })
    getStatistics(
        @Param('id', ParseIntPipe) id: number,
        @Query('from') from?: string,
        @Query('to') to?: string,
    ) {
        return this.statisticsService.getStatistics(id, { from, to });
    }

    @Get(':id/events-history')
    @Roles(Role.Admin, Role.Employee, Role.Receptionist)
    @ApiOperation({ summary: 'Get customer event history' })
    getEventHistory(
        @Param('id', ParseIntPipe) id: number,
        @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
        @Query('offset', new ParseIntPipe({ optional: true })) offset?: number,
        @Query('from') from?: string,
        @Query('to') to?: string,
        @Query('status') status?: string,
        @Query('withCounts') withCounts?: string,
    ) {
        return this.statisticsService.getEventHistory(id, {
            limit,
            offset,
            from,
            to,
            status,
            withCounts: withCounts === '1' || withCounts === 'true',
        });
    }

    // ==================== NOTES ====================

    @Get(':id/notes')
    @Roles(Role.Admin, Role.Employee, Role.Receptionist)
    @ApiOperation({ summary: 'Get customer notes' })
    getNotes(@Param('id', ParseIntPipe) id: number) {
        return this.customersService.findNotesForCustomer(id);
    }

    @Post(':id/notes')
    @Roles(Role.Admin, Role.Employee, Role.Receptionist)
    @ApiOperation({ summary: 'Add note to customer' })
    @ApiResponse({ status: 201 })
    addNote(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: CreateCustomerNoteDto,
        @Req() req: any,
    ) {
        return this.customersService.createNote(id, dto, req.user?.id);
    }

    @Patch('notes/:noteId')
    @Roles(Role.Admin, Role.Employee, Role.Receptionist)
    @ApiOperation({ summary: 'Update customer note' })
    updateNote(
        @Param('noteId', ParseIntPipe) noteId: number,
        @Body() dto: UpdateCustomerNoteDto,
    ) {
        return this.customersService.updateNote(noteId, dto);
    }

    @Delete('notes/:noteId')
    @Roles(Role.Admin, Role.Employee, Role.Receptionist)
    @ApiOperation({ summary: 'Delete customer note' })
    deleteNote(@Param('noteId', ParseIntPipe) noteId: number) {
        return this.customersService.deleteNote(noteId);
    }

    // ==================== TAGS ====================

    @Get(':id/tags')
    @Roles(Role.Admin, Role.Employee, Role.Receptionist)
    @ApiOperation({ summary: 'Get tags for customer' })
    getCustomerTags(@Param('id', ParseIntPipe) id: number) {
        return this.customersService.getTagsForCustomer(id);
    }

    @Post(':id/tags')
    @Roles(Role.Admin, Role.Employee, Role.Receptionist)
    @ApiOperation({ summary: 'Assign tags to customer' })
    @ApiResponse({ status: 201 })
    assignTags(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: AssignTagsDto,
    ) {
        return this.customersService.assignTagsToCustomer(id, dto.tagIds);
    }

    @Delete(':id/tags/:tagId')
    @Roles(Role.Admin, Role.Employee, Role.Receptionist)
    @ApiOperation({ summary: 'Remove tag from customer' })
    removeTag(
        @Param('id', ParseIntPipe) id: number,
        @Param('tagId', ParseIntPipe) tagId: number,
    ) {
        return this.customersService.removeTagFromCustomer(id, tagId);
    }

    // ==================== FILES ====================

    @Get(':id/files')
    @Roles(Role.Admin, Role.Employee, Role.Receptionist)
    @ApiOperation({ summary: 'List customer files' })
    listFiles(@Param('id', ParseIntPipe) id: number) {
        return this.mediaService.listFiles(id);
    }

    @Post(':id/files')
    @Roles(Role.Admin, Role.Employee, Role.Receptionist)
    @ApiOperation({ summary: 'Upload customer file' })
    @UseInterceptors(
        FileInterceptor('file', {
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
                    const customerId = Number(rawId);
                    if (!Number.isInteger(customerId) || customerId <= 0) {
                        return cb(new Error('Invalid customerId'), root);
                    }
                    const dir = path.join(
                        root,
                        'customers',
                        String(customerId),
                        'files',
                    );
                    fs.mkdirSync(dir, { recursive: true });
                    cb(null, dir);
                },
                filename: (
                    req: ExpressRequest & { __storedName?: string },
                    file: Express.Multer.File,
                    cb: (error: Error | null, filename: string) => void,
                ) => {
                    const ext = path
                        .extname(file.originalname || '')
                        .toLowerCase()
                        .slice(0, 10);
                    const name = `${uuidv4()}${ext || ''}`;
                    req.__storedName = name;
                    cb(null, name);
                },
            }),
            limits: { fileSize: 20 * 1024 * 1024 },
        }),
    )
    async uploadFile(
        @Param('id', ParseIntPipe) id: number,
        @Req() req: ExpressRequest & { __storedName?: string; user?: unknown },
        @UploadedFile() file: Express.Multer.File,
        @Body('category') category?: string,
        @Body('description') description?: string,
    ) {
        if (!file) {
            throw new Error('No file uploaded');
        }
        const storedName = String(req.__storedName || file.filename);
        const relPath = path.join('customers', String(id), 'files', storedName);
        const actorId = (() => {
            const user = req.user as { id?: unknown } | undefined;
            return typeof user?.id === 'number' ? user.id : null;
        })();
        return this.mediaService.createFile({
            customerId: id,
            actorId,
            storedRelativePath: relPath,
            storedName,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            category,
            description,
        });
    }

    @Get(':id/files/:fileId/download')
    @Roles(Role.Admin, Role.Employee, Role.Receptionist)
    @ApiOperation({ summary: 'Download customer file' })
    async downloadFile(
        @Param('id', ParseIntPipe) id: number,
        @Param('fileId', ParseIntPipe) fileId: number,
        @Res({ passthrough: true }) res: Response,
    ) {
        const { file, fullPath } = await this.mediaService.getFileForDownload(
            id,
            fileId,
        );
        res.setHeader('Content-Type', file.mimeType);
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${encodeURIComponent(file.originalName)}"`,
        );
        return new StreamableFile(createReadStream(fullPath));
    }

    @Delete(':id/files/:fileId')
    @Roles(Role.Admin, Role.Employee, Role.Receptionist)
    @ApiOperation({ summary: 'Delete customer file' })
    deleteFile(
        @Param('id', ParseIntPipe) id: number,
        @Param('fileId', ParseIntPipe) fileId: number,
    ) {
        return this.mediaService.deleteFile(id, fileId);
    }

    // ==================== GALLERY ====================

    @Get(':id/gallery')
    @Roles(Role.Admin, Role.Employee, Role.Receptionist)
    @ApiOperation({ summary: 'List customer gallery images' })
    listGallery(@Param('id', ParseIntPipe) id: number) {
        return this.mediaService.listGallery(id);
    }

    @Post(':id/gallery')
    @Roles(Role.Admin, Role.Employee, Role.Receptionist)
    @ApiOperation({ summary: 'Upload customer gallery image' })
    @UseInterceptors(
        FileInterceptor('image', {
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
                    const customerId = Number(rawId);
                    if (!Number.isInteger(customerId) || customerId <= 0) {
                        return cb(new Error('Invalid customerId'), root);
                    }
                    const dir = path.join(
                        root,
                        'customers',
                        String(customerId),
                        'gallery',
                    );
                    fs.mkdirSync(dir, { recursive: true });
                    cb(null, dir);
                },
                filename: (
                    req: ExpressRequest & { __galleryBase?: string },
                    file: Express.Multer.File,
                    cb: (error: Error | null, filename: string) => void,
                ) => {
                    const ext = path
                        .extname(file.originalname || '')
                        .toLowerCase()
                        .slice(0, 10);
                    const base = uuidv4();
                    req.__galleryBase = base;
                    cb(null, `${base}${ext || ''}`);
                },
            }),
            limits: { fileSize: 10 * 1024 * 1024 },
        }),
    )
    async uploadGalleryImage(
        @Param('id', ParseIntPipe) id: number,
        @Req() req: ExpressRequest & { __galleryBase?: string; user?: unknown },
        @UploadedFile() file: Express.Multer.File,
        @Body('description') description?: string,
        @Body('serviceId') serviceIdRaw?: string,
    ) {
        if (!file) {
            throw new Error('No image uploaded');
        }

        const base = String(req.__galleryBase || '').trim();
        const storedName = file.filename;
        const relPath = path.join(
            'customers',
            String(id),
            'gallery',
            storedName,
        );
        const thumbRel = path.join(
            'customers',
            String(id),
            'gallery',
            `${base || storedName.replace(path.extname(storedName), '')}.thumb.jpg`,
        );
        const actorId = (() => {
            const user = req.user as { id?: unknown } | undefined;
            return typeof user?.id === 'number' ? user.id : null;
        })();
        const serviceId =
            serviceIdRaw && serviceIdRaw.trim().length > 0
                ? Number(serviceIdRaw)
                : null;

        return this.mediaService.createGalleryImage({
            customerId: id,
            actorId,
            storedRelativePath: relPath,
            thumbnailRelativePath: thumbRel,
            mimeType: file.mimetype,
            size: file.size,
            description,
            serviceId: Number.isInteger(serviceId) ? serviceId : null,
        });
    }

    @Get(':id/gallery/:imageId')
    @Roles(Role.Admin, Role.Employee, Role.Receptionist)
    @ApiOperation({ summary: 'Get customer gallery image' })
    async getGalleryImage(
        @Param('id', ParseIntPipe) id: number,
        @Param('imageId', ParseIntPipe) imageId: number,
        @Res({ passthrough: true }) res: Response,
    ) {
        const { fullPath, mimeType } = await this.mediaService.getGalleryImage(
            id,
            imageId,
            'original',
        );
        res.setHeader('Content-Type', mimeType);
        return new StreamableFile(createReadStream(fullPath));
    }

    @Get(':id/gallery/:imageId/thumbnail')
    @Roles(Role.Admin, Role.Employee, Role.Receptionist)
    @ApiOperation({ summary: 'Get customer gallery thumbnail' })
    async getGalleryThumbnail(
        @Param('id', ParseIntPipe) id: number,
        @Param('imageId', ParseIntPipe) imageId: number,
        @Res({ passthrough: true }) res: Response,
    ) {
        const { fullPath, mimeType } = await this.mediaService.getGalleryImage(
            id,
            imageId,
            'thumbnail',
        );
        res.setHeader('Content-Type', mimeType);
        return new StreamableFile(createReadStream(fullPath));
    }

    @Delete(':id/gallery/:imageId')
    @Roles(Role.Admin, Role.Employee, Role.Receptionist)
    @ApiOperation({ summary: 'Delete customer gallery image' })
    deleteGalleryImage(
        @Param('id', ParseIntPipe) id: number,
        @Param('imageId', ParseIntPipe) imageId: number,
    ) {
        return this.mediaService.deleteGalleryImage(id, imageId);
    }
}

// Separate controller for groups and tags management
@ApiTags('customer-groups')
@Controller('customer-groups')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CustomerGroupsController {
    constructor(private readonly customersService: CustomersService) {}

    @Get()
    @Roles(Role.Admin, Role.Employee, Role.Receptionist)
    @ApiOperation({ summary: 'List all customer groups' })
    list() {
        return this.customersService.findAllGroups();
    }

    @Get(':id')
    @Roles(Role.Admin, Role.Employee, Role.Receptionist)
    @ApiOperation({ summary: 'Get customer group by ID' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.customersService.findOneGroup(id);
    }

    @Post()
    @Roles(Role.Admin, Role.Employee, Role.Receptionist)
    @ApiOperation({ summary: 'Create customer group' })
    @ApiResponse({ status: 201 })
    create(@Body() dto: CreateCustomerGroupDto) {
        return this.customersService.createGroup(dto);
    }

    @Put(':id')
    @Roles(Role.Admin, Role.Employee, Role.Receptionist)
    @ApiOperation({ summary: 'Update customer group' })
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateCustomerGroupDto,
    ) {
        return this.customersService.updateGroup(id, dto);
    }

    @Delete(':id')
    @Roles(Role.Admin, Role.Employee, Role.Receptionist)
    @ApiOperation({ summary: 'Delete customer group' })
    delete(@Param('id', ParseIntPipe) id: number) {
        return this.customersService.deleteGroup(id);
    }

    @Post(':id/members')
    @Roles(Role.Admin, Role.Employee, Role.Receptionist)
    @ApiOperation({ summary: 'Add members to group' })
    addMembers(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: AddMembersDto,
    ) {
        return this.customersService.addMembersToGroup(id, dto.customerIds);
    }

    @Delete(':id/members/:customerId')
    @Roles(Role.Admin, Role.Employee, Role.Receptionist)
    @ApiOperation({ summary: 'Remove member from group' })
    removeMember(
        @Param('id', ParseIntPipe) id: number,
        @Param('customerId', ParseIntPipe) customerId: number,
    ) {
        return this.customersService.removeMemberFromGroup(id, customerId);
    }
}

@ApiTags('customer-tags')
@Controller('customer-tags')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CustomerTagsController {
    constructor(private readonly customersService: CustomersService) {}

    @Get()
    @Roles(Role.Admin, Role.Employee, Role.Receptionist)
    @ApiOperation({ summary: 'List all customer tags' })
    list() {
        return this.customersService.findAllTags();
    }

    @Post()
    @Roles(Role.Admin)
    @ApiOperation({ summary: 'Create customer tag' })
    @ApiResponse({ status: 201 })
    create(@Body() dto: CreateCustomerTagDto) {
        return this.customersService.createTag(dto);
    }

    @Put(':id')
    @Roles(Role.Admin)
    @ApiOperation({ summary: 'Update customer tag' })
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateCustomerTagDto,
    ) {
        return this.customersService.updateTag(id, dto);
    }

    @Delete(':id')
    @Roles(Role.Admin)
    @ApiOperation({ summary: 'Delete customer tag' })
    delete(@Param('id', ParseIntPipe) id: number) {
        return this.customersService.deleteTag(id);
    }
}
