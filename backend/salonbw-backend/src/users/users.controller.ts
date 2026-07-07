import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    NotFoundException,
    Patch,
    Post,
    StreamableFile,
    Param,
    UseGuards,
    Query,
    HttpCode,
    HttpStatus,
    Res,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { SkipThrottle } from '@nestjs/throttler';
import { diskStorage } from 'multer';
import { randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Request as ExpressRequest, Response } from 'express';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateConsentDto } from './dto/update-consent.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserDto } from './dto/user.dto';
import { Role } from './role.enum';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

class ChangePasswordDto {
    @IsString()
    currentPassword!: string;
    @IsString()
    @MinLength(6)
    newPassword!: string;
}

class ListUsersQuery {
    @IsOptional()
    @IsEnum(Role)
    role?: Role;
}

@ApiTags('Users')
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Client, Role.Employee, Role.Receptionist, Role.Admin)
    @SkipThrottle()
    @Get('profile')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user profile' })
    @ApiResponse({ status: 200, description: 'Current user profile' })
    async getProfile(@CurrentUser() user: { userId: number; role: string }) {
        const profile = await this.usersService.findById(user.userId);
        if (!profile) {
            return user;
        }

        const { password: _password, ...safeProfile } = profile;
        void _password;
        return safeProfile;
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Client, Role.Employee, Role.Receptionist, Role.Admin)
    @SkipThrottle()
    @Patch('profile')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update current user profile' })
    @ApiResponse({ status: 200 })
    async updateProfile(
        @CurrentUser() user: { userId: number },
        @Body() dto: UpdateProfileDto,
    ) {
        const updated = await this.usersService.updateProfile(user.userId, dto);
        if (!updated) {
            return user;
        }
        const { password: _password, ...safeProfile } = updated;
        void _password;
        return safeProfile;
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Client, Role.Employee, Role.Receptionist, Role.Admin)
    @SkipThrottle()
    @Post('profile/avatar')
    @UseInterceptors(
        FileInterceptor('avatar', {
            storage: diskStorage({
                destination: (
                    req: ExpressRequest,
                    _file: Express.Multer.File,
                    cb: (error: Error | null, destination: string) => void,
                ) => {
                    const root =
                        (process.env.UPLOADS_DIR || '').trim() ||
                        path.join(process.cwd(), 'uploads');
                    const reqUser = req.user as
                        | { userId?: unknown; id?: unknown }
                        | undefined;
                    const userId = Number(reqUser?.userId ?? reqUser?.id);
                    if (!Number.isInteger(userId) || userId <= 0) {
                        return cb(new Error('Invalid userId'), root);
                    }
                    const dir = path.join(
                        root,
                        'users',
                        String(userId),
                        'avatar',
                    );
                    fs.mkdirSync(dir, { recursive: true });
                    cb(null, dir);
                },
                filename: (
                    _req: ExpressRequest,
                    file: Express.Multer.File,
                    cb: (error: Error | null, filename: string) => void,
                ) => {
                    const ext = path
                        .extname(file.originalname || '')
                        .toLowerCase()
                        .slice(0, 10);
                    cb(null, `${randomUUID()}${ext || '.jpg'}`);
                },
            }),
            fileFilter: (_req, file, cb) => {
                if (!file.mimetype?.startsWith('image/')) {
                    return cb(new Error('Only image files are allowed'), false);
                }
                cb(null, true);
            },
            limits: { fileSize: 5 * 1024 * 1024 },
        }),
    )
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Upload current user profile avatar' })
    async uploadProfileAvatar(
        @CurrentUser() user: { userId: number },
        @UploadedFile() file: Express.Multer.File,
    ) {
        if (!file) {
            throw new BadRequestException('No image uploaded');
        }
        const storedName = path.basename(file.filename);
        const avatarUrl = `/api/users/profile/avatar/${storedName}`;
        const updated = await this.usersService.updateAvatarUrl(
            user.userId,
            avatarUrl,
        );
        if (!updated) return user;
        const { password: _password, ...safeProfile } = updated;
        void _password;
        return safeProfile;
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Client, Role.Employee, Role.Receptionist, Role.Admin)
    @SkipThrottle()
    @Get('profile/avatar/:fileName')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Download current user profile avatar' })
    getProfileAvatar(
        @CurrentUser() user: { userId: number },
        @Param('fileName') fileName: string,
        @Res({ passthrough: true }) res: Response,
    ) {
        const safeName = path.basename(fileName);
        if (!safeName || safeName !== fileName) {
            throw new BadRequestException('Invalid avatar file');
        }
        const root =
            (process.env.UPLOADS_DIR || '').trim() ||
            path.join(process.cwd(), 'uploads');
        const fullPath = path.join(
            root,
            'users',
            String(user.userId),
            'avatar',
            safeName,
        );
        if (!fs.existsSync(fullPath)) {
            throw new NotFoundException('Avatar not found');
        }
        const ext = path.extname(safeName).toLowerCase();
        const contentType =
            ext === '.png'
                ? 'image/png'
                : ext === '.webp'
                  ? 'image/webp'
                  : ext === '.gif'
                    ? 'image/gif'
                    : 'image/jpeg';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'private, max-age=300');
        return new StreamableFile(createReadStream(fullPath));
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Client, Role.Employee, Role.Receptionist, Role.Admin)
    @SkipThrottle()
    @Delete('profile/avatar')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Remove current user profile avatar' })
    async removeProfileAvatar(@CurrentUser() user: { userId: number }) {
        const updated = await this.usersService.updateAvatarUrl(
            user.userId,
            null,
        );
        if (!updated) return user;
        const { password: _password, ...safeProfile } = updated;
        void _password;
        return safeProfile;
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Client, Role.Employee, Role.Receptionist, Role.Admin)
    @SkipThrottle()
    @Patch('profile/consent')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update current user GDPR consent preferences' })
    @ApiResponse({ status: 200 })
    async updateConsent(
        @CurrentUser() user: { userId: number },
        @Body() dto: UpdateConsentDto,
    ) {
        return this.usersService.updateConsent(user.userId, dto);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Client, Role.Employee, Role.Receptionist, Role.Admin)
    @SkipThrottle()
    @Patch('profile/password')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Change own password' })
    async changePassword(
        @CurrentUser() user: { userId: number },
        @Body() dto: ChangePasswordDto,
    ) {
        await this.usersService.changePassword(
            user.userId,
            dto.currentPassword,
            dto.newPassword,
        );
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @Get()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'List users (optionally filter by role)' })
    @ApiResponse({ status: 200, type: UserDto, isArray: true })
    async findAll(@Query() q: ListUsersQuery): Promise<UserDto[]> {
        const users = await this.usersService.findAllByRole(q.role);
        return users.map(({ password: _password, ...rest }) => {
            void _password;
            return rest;
        });
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @Post()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create user' })
    @ApiResponse({ status: 201, description: 'User created', type: UserDto })
    async create(@Body() createUserDto: CreateUserDto) {
        const user = await this.usersService.createUser(createUserDto);
        const { password: _password, ...result } = user;
        void _password;
        return result;
    }
}
