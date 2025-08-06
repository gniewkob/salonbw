import { ApiErrorResponses } from '../common/decorators/api-error-responses.decorator';
import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    UseGuards,
    NotFoundException,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Public } from '../auth/public.decorator';
import { Role } from '../users/role.enum';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@ApiTags('Services')
@Controller('services')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ServicesController {
    constructor(private readonly service: ServicesService) {}

    @Public()
    @Get()
    @ApiOperation({ summary: 'List all services' })
    @ApiResponse({ status: 200 })
    @ApiErrorResponses()
    list() {
        return this.service.findAll();
    }

    @Public()
    @Get(':id')
    @ApiOperation({ summary: 'Get service by id' })
    @ApiResponse({ status: 200 })
    @ApiErrorResponses()
    @ApiResponse({ status: 404 })
    @ApiErrorResponses()
    async get(@Param('id') id: number) {
        const svc = await this.service.findOne(Number(id));
        if (!svc) {
            throw new NotFoundException();
        }
        return svc;
    }

    @Post()
    @Roles(Role.Admin)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create service' })
    @ApiResponse({ status: 201 })
    @ApiErrorResponses()
    create(@Body() dto: CreateServiceDto) {
        return this.service.create(dto);
    }

    @Patch(':id')
    @Roles(Role.Admin)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update service' })
    update(@Param('id') id: number, @Body() dto: UpdateServiceDto) {
        return this.service.update(Number(id), dto);
    }

    @Delete(':id')
    @Roles(Role.Admin)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete service' })
    remove(@Param('id') id: number) {
        return this.service.remove(Number(id));
    }
}
