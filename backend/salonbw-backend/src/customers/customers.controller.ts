import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Put,
    Query,
    Req,
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
import { CustomersService } from './customers.service';
import { CustomerStatisticsService } from './customer-statistics.service';
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
    getStatistics(@Param('id', ParseIntPipe) id: number) {
        return this.statisticsService.getStatistics(id);
    }

    @Get(':id/events-history')
    @Roles(Role.Admin, Role.Employee, Role.Receptionist)
    @ApiOperation({ summary: 'Get customer event history' })
    getEventHistory(
        @Param('id', ParseIntPipe) id: number,
        @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
        @Query('offset', new ParseIntPipe({ optional: true })) offset?: number,
    ) {
        return this.statisticsService.getEventHistory(id, { limit, offset });
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
}

// Separate controller for groups and tags management
@ApiTags('customer-groups')
@Controller('customer-groups')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CustomerGroupsController {
    constructor(private readonly customersService: CustomersService) {}

    @Get()
    @Roles(Role.Admin)
    @ApiOperation({ summary: 'List all customer groups' })
    list() {
        return this.customersService.findAllGroups();
    }

    @Get(':id')
    @Roles(Role.Admin)
    @ApiOperation({ summary: 'Get customer group by ID' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.customersService.findOneGroup(id);
    }

    @Post()
    @Roles(Role.Admin)
    @ApiOperation({ summary: 'Create customer group' })
    @ApiResponse({ status: 201 })
    create(@Body() dto: CreateCustomerGroupDto) {
        return this.customersService.createGroup(dto);
    }

    @Put(':id')
    @Roles(Role.Admin)
    @ApiOperation({ summary: 'Update customer group' })
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateCustomerGroupDto,
    ) {
        return this.customersService.updateGroup(id, dto);
    }

    @Delete(':id')
    @Roles(Role.Admin)
    @ApiOperation({ summary: 'Delete customer group' })
    delete(@Param('id', ParseIntPipe) id: number) {
        return this.customersService.deleteGroup(id);
    }

    @Post(':id/members')
    @Roles(Role.Admin)
    @ApiOperation({ summary: 'Add members to group' })
    addMembers(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: AddMembersDto,
    ) {
        return this.customersService.addMembersToGroup(id, dto.customerIds);
    }

    @Delete(':id/members/:customerId')
    @Roles(Role.Admin)
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
