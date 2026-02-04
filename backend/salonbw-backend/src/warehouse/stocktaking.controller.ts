import {
    Controller,
    Get,
    Post,
    Patch,
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
import { StocktakingService } from './stocktaking.service';
import {
    CreateStocktakingDto,
    UpdateStocktakingDto,
    AddStocktakingItemsDto,
    UpdateStocktakingItemDto,
    CompleteStocktakingDto,
} from './dto/stocktaking.dto';
import { StocktakingStatus } from './entities/stocktaking.entity';

@ApiTags('stocktaking')
@ApiBearerAuth()
@Controller('stocktaking')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class StocktakingController {
    constructor(private readonly stocktakingService: StocktakingService) {}

    @Get()
    @Roles(Role.Admin, Role.Employee)
    @ApiOperation({ summary: 'Lista wszystkich inwentaryzacji' })
    @ApiQuery({ name: 'status', required: false, enum: StocktakingStatus })
    @ApiQuery({ name: 'from', required: false, type: String })
    @ApiQuery({ name: 'to', required: false, type: String })
    findAll(
        @Query('status') status?: StocktakingStatus,
        @Query('from') from?: string,
        @Query('to') to?: string,
    ) {
        return this.stocktakingService.findAll({
            status,
            from: from ? new Date(from) : undefined,
            to: to ? new Date(to) : undefined,
        });
    }

    @Get('history')
    @Roles(Role.Admin, Role.Employee)
    @ApiOperation({ summary: 'Historia inwentaryzacji (agregaty)' })
    findHistorySummary() {
        return this.stocktakingService.findHistorySummary();
    }

    @Get(':id')
    @Roles(Role.Admin, Role.Employee)
    @ApiOperation({ summary: 'Pobierz inwentaryzację po ID' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.stocktakingService.findOne(id);
    }

    @Post()
    @Roles(Role.Admin)
    @ApiOperation({ summary: 'Utwórz nową inwentaryzację' })
    create(@Body() dto: CreateStocktakingDto, @CurrentUser() user: User) {
        return this.stocktakingService.create(dto, user);
    }

    @Patch(':id')
    @Roles(Role.Admin)
    @ApiOperation({ summary: 'Aktualizuj inwentaryzację' })
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateStocktakingDto,
        @CurrentUser() user: User,
    ) {
        return this.stocktakingService.update(id, dto, user);
    }

    @Post(':id/start')
    @Roles(Role.Admin)
    @ApiOperation({ summary: 'Rozpocznij inwentaryzację (załaduj produkty)' })
    start(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
        return this.stocktakingService.start(id, user);
    }

    @Post(':id/items')
    @Roles(Role.Admin, Role.Employee)
    @ApiOperation({ summary: 'Dodaj/aktualizuj pozycje inwentaryzacji' })
    addItems(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: AddStocktakingItemsDto,
        @CurrentUser() user: User,
    ) {
        return this.stocktakingService.addItems(id, dto, user);
    }

    @Patch(':id/items/:itemId')
    @Roles(Role.Admin, Role.Employee)
    @ApiOperation({ summary: 'Aktualizuj pozycję inwentaryzacji' })
    updateItem(
        @Param('id', ParseIntPipe) stocktakingId: number,
        @Param('itemId', ParseIntPipe) itemId: number,
        @Body() dto: UpdateStocktakingItemDto,
    ) {
        return this.stocktakingService.updateItem(stocktakingId, itemId, dto);
    }

    @Post(':id/complete')
    @Roles(Role.Admin)
    @ApiOperation({ summary: 'Zakończ inwentaryzację (opcjonalnie zastosuj różnice)' })
    complete(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: CompleteStocktakingDto,
        @CurrentUser() user: User,
    ) {
        return this.stocktakingService.complete(id, dto, user);
    }
}
