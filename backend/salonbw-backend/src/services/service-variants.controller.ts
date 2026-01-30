import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    UseGuards,
    ParseIntPipe,
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
import { ServiceVariantsService } from './service-variants.service';
import { ServiceVariant } from './entities/service-variant.entity';
import {
    CreateServiceVariantDto,
    UpdateServiceVariantDto,
    ReorderVariantsDto,
} from './dto/service-variant.dto';

@ApiTags('service-variants')
@Controller('services/:serviceId/variants')
export class ServiceVariantsController {
    constructor(private readonly variantsService: ServiceVariantsService) {}

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Client, Role.Employee, Role.Admin, Role.Receptionist)
    @Get()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all variants for a service' })
    @ApiResponse({ status: 200, type: ServiceVariant, isArray: true })
    findByService(
        @Param('serviceId', ParseIntPipe) serviceId: number,
    ): Promise<ServiceVariant[]> {
        return this.variantsService.findByService(serviceId);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @Post()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create service variant' })
    @ApiResponse({ status: 201, type: ServiceVariant })
    create(
        @Param('serviceId', ParseIntPipe) serviceId: number,
        @Body() dto: CreateServiceVariantDto,
    ): Promise<ServiceVariant> {
        return this.variantsService.create(serviceId, dto);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @Patch('reorder')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Reorder variants (drag & drop)' })
    @ApiResponse({ status: 200, description: 'Variants reordered' })
    reorder(
        @Param('serviceId', ParseIntPipe) serviceId: number,
        @Body() dto: ReorderVariantsDto,
    ): Promise<void> {
        return this.variantsService.reorder(serviceId, dto);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @Patch(':id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update service variant' })
    @ApiResponse({ status: 200, type: ServiceVariant })
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateServiceVariantDto,
    ): Promise<ServiceVariant> {
        return this.variantsService.update(id, dto);
    }

    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    @Delete(':id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete service variant' })
    @ApiResponse({ status: 200, description: 'Variant deleted' })
    remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return this.variantsService.remove(id);
    }
}
