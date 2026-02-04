import {
    Body,
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    UseGuards,
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
import { OrdersService } from './orders.service';
import {
    CreateWarehouseOrderDto,
    ReceiveWarehouseOrderDto,
    UpdateWarehouseOrderDto,
} from './dto/order.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../users/user.entity';

@ApiTags('orders')
@Controller('orders')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) {}

    @Roles(Role.Admin, Role.Employee)
    @Get()
    @ApiOperation({ summary: 'Get warehouse orders' })
    @ApiResponse({ status: 200, description: 'Warehouse orders' })
    findAll() {
        return this.ordersService.findAll();
    }

    @Roles(Role.Admin, Role.Employee)
    @Get(':id')
    @ApiOperation({ summary: 'Get warehouse order details' })
    @ApiResponse({ status: 200, description: 'Warehouse order details' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.ordersService.findOne(id);
    }

    @Roles(Role.Admin, Role.Employee)
    @Post()
    @ApiOperation({ summary: 'Create warehouse order' })
    @ApiResponse({ status: 201, description: 'Warehouse order created' })
    create(
        @Body() dto: CreateWarehouseOrderDto,
        @CurrentUser() user: { userId: number },
    ) {
        return this.ordersService.create(dto, { id: user.userId } as User);
    }

    @Roles(Role.Admin, Role.Employee)
    @Patch(':id')
    @ApiOperation({ summary: 'Update warehouse order' })
    @ApiResponse({ status: 200, description: 'Warehouse order updated' })
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateWarehouseOrderDto,
        @CurrentUser() user: { userId: number },
    ) {
        return this.ordersService.update(id, dto, { id: user.userId } as User);
    }

    @Roles(Role.Admin, Role.Employee)
    @Patch(':id/send')
    @ApiOperation({ summary: 'Send warehouse order' })
    @ApiResponse({ status: 200, description: 'Warehouse order sent' })
    send(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: { userId: number },
    ) {
        return this.ordersService.send(id, { id: user.userId } as User);
    }

    @Roles(Role.Admin, Role.Employee)
    @Patch(':id/cancel')
    @ApiOperation({ summary: 'Cancel warehouse order' })
    @ApiResponse({ status: 200, description: 'Warehouse order cancelled' })
    cancel(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: { userId: number },
    ) {
        return this.ordersService.cancel(id, { id: user.userId } as User);
    }

    @Roles(Role.Admin, Role.Employee)
    @Patch(':id/receive')
    @ApiOperation({ summary: 'Receive warehouse order' })
    @ApiResponse({ status: 200, description: 'Warehouse order received' })
    receive(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: ReceiveWarehouseOrderDto,
        @CurrentUser() user: { userId: number },
    ) {
        return this.ordersService.receive(id, dto, { id: user.userId } as User);
    }
}
