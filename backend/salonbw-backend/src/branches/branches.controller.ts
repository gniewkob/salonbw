import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
    ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../users/role.enum';
import { BranchesService } from './branches.service';
import {
    CreateBranchDto,
    UpdateBranchDto,
    AddBranchMemberDto,
    UpdateBranchMemberDto,
    BranchQueryDto,
} from './dto/branch.dto';

@Controller('branches')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class BranchesController {
    constructor(private readonly branchesService: BranchesService) {}

    // List all branches (admin only for all, others see their own)
    @Get()
    @Roles(Role.Admin)
    async findAll(@Query() query: BranchQueryDto) {
        return this.branchesService.findAll(query);
    }

    // Get current user's branches
    @Get('my')
    async getMyBranches(@Request() req: { user: { id: number } }) {
        return this.branchesService.getUserBranches(req.user.id);
    }

    // Get current user's primary branch
    @Get('my/primary')
    async getMyPrimaryBranch(@Request() req: { user: { id: number } }) {
        return this.branchesService.getUserPrimaryBranch(req.user.id);
    }

    // Get branch by ID
    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number) {
        return this.branchesService.findOne(id);
    }

    // Get branch by slug (for public booking pages)
    @Get('slug/:slug')
    async findBySlug(@Param('slug') slug: string) {
        return this.branchesService.findBySlug(slug);
    }

    // Create new branch (admin only)
    @Post()
    @Roles(Role.Admin)
    async create(
        @Body() dto: CreateBranchDto,
        @Request() req: { user: { id: number } },
    ) {
        return this.branchesService.create(dto, req.user.id);
    }

    // Update branch
    @Put(':id')
    @Roles(Role.Admin)
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateBranchDto,
        @Request() req: { user: { id: number } },
    ) {
        return this.branchesService.update(id, dto, req.user.id);
    }

    // Delete (deactivate) branch
    @Delete(':id')
    @Roles(Role.Admin)
    async delete(
        @Param('id', ParseIntPipe) id: number,
        @Request() req: { user: { id: number } },
    ) {
        return this.branchesService.delete(id, req.user.id);
    }

    // Branch members
    @Get(':id/members')
    @Roles(Role.Admin)
    async getMembers(@Param('id', ParseIntPipe) id: number) {
        return this.branchesService.getMembers(id);
    }

    @Post(':id/members')
    @Roles(Role.Admin)
    async addMember(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: AddBranchMemberDto,
    ) {
        return this.branchesService.addMember(id, dto);
    }

    @Put(':id/members/:userId')
    @Roles(Role.Admin)
    async updateMember(
        @Param('id', ParseIntPipe) id: number,
        @Param('userId', ParseIntPipe) userId: number,
        @Body() dto: UpdateBranchMemberDto,
    ) {
        return this.branchesService.updateMember(id, userId, dto);
    }

    @Delete(':id/members/:userId')
    @Roles(Role.Admin)
    async removeMember(
        @Param('id', ParseIntPipe) id: number,
        @Param('userId', ParseIntPipe) userId: number,
    ) {
        return this.branchesService.removeMember(id, userId);
    }

    // Cross-branch statistics
    @Get('stats/cross-branch')
    @Roles(Role.Admin)
    async getCrossBranchStats(@Request() req: { user: { id: number } }) {
        return this.branchesService.getCrossBranchStats(req.user.id);
    }
}
