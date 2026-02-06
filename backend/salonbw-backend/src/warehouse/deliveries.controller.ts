import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    Query,
    ParseIntPipe,
    UseGuards,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiBearerAuth,
    ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { Role } from '../users/role.enum';
import { User } from '../users/user.entity';
import { DeliveriesService } from './deliveries.service';
import {
    CreateDeliveryDto,
    UpdateDeliveryDto,
    AddDeliveryItemDto,
    UpdateDeliveryItemDto,
    ReceiveDeliveryDto,
} from './dto/delivery.dto';
import { DeliveryStatus } from './entities/delivery.entity';

@ApiTags('deliveries')
@ApiBearerAuth()
@Controller('deliveries')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class DeliveriesController {
    constructor(private readonly deliveriesService: DeliveriesService) {}

    @Get()
    @Roles(Role.Admin, Role.Employee)
    @ApiOperation({ summary: 'Lista wszystkich dostaw' })
    @ApiQuery({ name: 'supplierId', required: false, type: Number })
    @ApiQuery({ name: 'status', required: false, enum: DeliveryStatus })
    @ApiQuery({ name: 'from', required: false, type: String })
    @ApiQuery({ name: 'to', required: false, type: String })
    findAll(
        @Query('supplierId') supplierId?: string,
        @Query('status') status?: DeliveryStatus,
        @Query('from') from?: string,
        @Query('to') to?: string,
    ) {
        return this.deliveriesService.findAll({
            supplierId: supplierId ? parseInt(supplierId, 10) : undefined,
            status,
            from: from ? new Date(from) : undefined,
            to: to ? new Date(to) : undefined,
        });
    }

    @Get(':id')
    @Roles(Role.Admin, Role.Employee)
    @ApiOperation({ summary: 'Pobierz dostawę po ID' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.deliveriesService.findOne(id);
    }

    @Post()
    @Roles(Role.Admin)
    @ApiOperation({ summary: 'Utwórz nową dostawę' })
    create(@Body() dto: CreateDeliveryDto, @CurrentUser() user: User) {
        return this.deliveriesService.create(dto, user);
    }

    @Patch(':id')
    @Roles(Role.Admin)
    @ApiOperation({ summary: 'Aktualizuj dostawę' })
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateDeliveryDto,
        @CurrentUser() user: User,
    ) {
        return this.deliveriesService.update(id, dto, user);
    }

    @Post(':id/items')
    @Roles(Role.Admin)
    @ApiOperation({ summary: 'Dodaj pozycję do dostawy' })
    addItem(
        @Param('id', ParseIntPipe) deliveryId: number,
        @Body() dto: AddDeliveryItemDto,
    ) {
        return this.deliveriesService.addItem(deliveryId, dto);
    }

    @Patch(':id/items/:itemId')
    @Roles(Role.Admin)
    @ApiOperation({ summary: 'Aktualizuj pozycję w dostawie' })
    updateItem(
        @Param('id', ParseIntPipe) deliveryId: number,
        @Param('itemId', ParseIntPipe) itemId: number,
        @Body() dto: UpdateDeliveryItemDto,
    ) {
        return this.deliveriesService.updateItem(deliveryId, itemId, dto);
    }

    @Delete(':id/items/:itemId')
    @Roles(Role.Admin)
    @ApiOperation({ summary: 'Usuń pozycję z dostawy' })
    removeItem(
        @Param('id', ParseIntPipe) deliveryId: number,
        @Param('itemId', ParseIntPipe) itemId: number,
    ) {
        return this.deliveriesService.removeItem(deliveryId, itemId);
    }

    @Post(':id/receive')
    @Roles(Role.Admin)
    @ApiOperation({
        summary: 'Przyjmij dostawę (zaktualizuj stany magazynowe)',
    })
    receive(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: ReceiveDeliveryDto,
        @CurrentUser() user: User,
    ) {
        return this.deliveriesService.receive(id, dto, user);
    }

    @Post(':id/cancel')
    @Roles(Role.Admin)
    @ApiOperation({ summary: 'Anuluj dostawę' })
    cancel(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
        return this.deliveriesService.cancel(id, user);
    }
}
