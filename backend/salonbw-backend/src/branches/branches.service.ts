import {
    Injectable,
    Logger,
    NotFoundException,
    ConflictException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Branch, BranchMember, BranchStatus } from './entities/branch.entity';
import {
    CreateBranchDto,
    UpdateBranchDto,
    AddBranchMemberDto,
    UpdateBranchMemberDto,
    BranchQueryDto,
} from './dto/branch.dto';
import { LogService } from '../logs/log.service';
import { LogAction } from '../logs/log-action.enum';

@Injectable()
export class BranchesService {
    private readonly logger = new Logger(BranchesService.name);

    constructor(
        @InjectRepository(Branch)
        private readonly branchRepo: Repository<Branch>,
        @InjectRepository(BranchMember)
        private readonly memberRepo: Repository<BranchMember>,
        private readonly logService: LogService,
    ) {}

    // Branch CRUD
    async findAll(query: BranchQueryDto): Promise<Branch[]> {
        const where: FindOptionsWhere<Branch> = {};

        if (query.status) {
            where.status = query.status;
        }
        if (query.city) {
            where.city = query.city;
        }
        if (query.onlineBookingEnabled !== undefined) {
            where.onlineBookingEnabled = query.onlineBookingEnabled;
        }
        if (query.ownerId) {
            where.ownerId = query.ownerId;
        }

        return this.branchRepo.find({
            where,
            order: { sortOrder: 'ASC', name: 'ASC' },
            relations: ['owner'],
        });
    }

    async findOne(id: number): Promise<Branch> {
        const branch = await this.branchRepo.findOne({
            where: { id },
            relations: ['owner', 'members', 'members.user'],
        });

        if (!branch) {
            throw new NotFoundException(`Branch with ID ${id} not found`);
        }

        return branch;
    }

    async findBySlug(slug: string): Promise<Branch> {
        const branch = await this.branchRepo.findOne({
            where: { slug },
            relations: ['owner'],
        });

        if (!branch) {
            throw new NotFoundException(`Branch with slug "${slug}" not found`);
        }

        return branch;
    }

    async create(dto: CreateBranchDto, actorId: number): Promise<Branch> {
        // Generate slug if not provided
        const slug = dto.slug || this.generateSlug(dto.name);

        // Check for slug uniqueness
        const existing = await this.branchRepo.findOne({ where: { slug } });
        if (existing) {
            throw new ConflictException(
                `Branch with slug "${slug}" already exists`,
            );
        }

        const branch = this.branchRepo.create({
            ...dto,
            slug,
            ownerId: actorId,
        });

        const saved = await this.branchRepo.save(branch);

        // Add creator as branch manager
        await this.addMember(saved.id, {
            userId: actorId,
            branchRole: 'admin',
            isPrimary: true,
            canManage: true,
        });

        await this.logService.logAction(
            { id: actorId } as any,
            LogAction.BRANCH_CREATED,
            { branchId: saved.id, name: saved.name },
        );

        this.logger.log(`Branch "${saved.name}" created by user ${actorId}`);
        return saved;
    }

    async update(
        id: number,
        dto: UpdateBranchDto,
        actorId: number,
    ): Promise<Branch> {
        const branch = await this.findOne(id);

        // Check slug uniqueness if changing
        if (dto.slug && dto.slug !== branch.slug) {
            const existing = await this.branchRepo.findOne({
                where: { slug: dto.slug },
            });
            if (existing) {
                throw new ConflictException(
                    `Branch with slug "${dto.slug}" already exists`,
                );
            }
        }

        Object.assign(branch, dto);
        const updated = await this.branchRepo.save(branch);

        await this.logService.logAction(
            { id: actorId } as any,
            LogAction.BRANCH_UPDATED,
            { branchId: id, changes: dto },
        );

        this.logger.log(`Branch ${id} updated by user ${actorId}`);
        return updated;
    }

    async delete(id: number, actorId: number): Promise<void> {
        const branch = await this.findOne(id);

        // Soft delete by setting status to inactive
        branch.status = BranchStatus.Inactive;
        await this.branchRepo.save(branch);

        await this.logService.logAction(
            { id: actorId } as any,
            LogAction.BRANCH_DELETED,
            { branchId: id, name: branch.name },
        );

        this.logger.log(
            `Branch ${id} deleted (deactivated) by user ${actorId}`,
        );
    }

    // Branch Members
    async getMembers(branchId: number): Promise<BranchMember[]> {
        return this.memberRepo.find({
            where: { branchId, isActive: true },
            relations: ['user'],
            order: { branchRole: 'ASC', createdAt: 'ASC' },
        });
    }

    async addMember(
        branchId: number,
        dto: AddBranchMemberDto,
    ): Promise<BranchMember> {
        // Verify branch exists
        await this.findOne(branchId);

        // Check if user is already a member
        const existing = await this.memberRepo.findOne({
            where: { branchId, userId: dto.userId },
        });

        if (existing) {
            if (existing.isActive) {
                throw new ConflictException(
                    'User is already a member of this branch',
                );
            }
            // Reactivate existing membership
            existing.isActive = true;
            existing.branchRole = dto.branchRole || existing.branchRole;
            existing.isPrimary = dto.isPrimary ?? existing.isPrimary;
            existing.canManage = dto.canManage ?? existing.canManage;
            return this.memberRepo.save(existing);
        }

        // If setting as primary, remove primary from other branches
        if (dto.isPrimary) {
            await this.memberRepo.update(
                { userId: dto.userId, isPrimary: true },
                { isPrimary: false },
            );
        }

        const member = this.memberRepo.create({
            branchId,
            userId: dto.userId,
            branchRole: dto.branchRole || 'employee',
            isPrimary: dto.isPrimary ?? false,
            canManage: dto.canManage ?? false,
        });

        return this.memberRepo.save(member);
    }

    async updateMember(
        branchId: number,
        userId: number,
        dto: UpdateBranchMemberDto,
    ): Promise<BranchMember> {
        const member = await this.memberRepo.findOne({
            where: { branchId, userId },
        });

        if (!member) {
            throw new NotFoundException('Branch member not found');
        }

        // If setting as primary, remove primary from other branches
        if (dto.isPrimary) {
            await this.memberRepo.update(
                { userId, isPrimary: true },
                { isPrimary: false },
            );
        }

        Object.assign(member, dto);
        return this.memberRepo.save(member);
    }

    async removeMember(branchId: number, userId: number): Promise<void> {
        const member = await this.memberRepo.findOne({
            where: { branchId, userId },
        });

        if (!member) {
            throw new NotFoundException('Branch member not found');
        }

        member.isActive = false;
        await this.memberRepo.save(member);
    }

    // User's branches
    async getUserBranches(userId: number): Promise<Branch[]> {
        const members = await this.memberRepo.find({
            where: { userId, isActive: true },
            relations: ['branch'],
            order: { isPrimary: 'DESC', createdAt: 'ASC' },
        });

        return members
            .map((m) => m.branch)
            .filter((b) => b.status === BranchStatus.Active);
    }

    async getUserPrimaryBranch(userId: number): Promise<Branch | null> {
        const member = await this.memberRepo.findOne({
            where: { userId, isPrimary: true, isActive: true },
            relations: ['branch'],
        });

        return member?.branch ?? null;
    }

    async canUserAccessBranch(
        userId: number,
        branchId: number,
    ): Promise<boolean> {
        const member = await this.memberRepo.findOne({
            where: { userId, branchId, isActive: true },
        });
        return !!member;
    }

    async canUserManageBranch(
        userId: number,
        branchId: number,
    ): Promise<boolean> {
        const member = await this.memberRepo.findOne({
            where: { userId, branchId, isActive: true, canManage: true },
        });
        return !!member;
    }

    // Cross-branch statistics (for owners/admins)
    async getCrossBranchStats(ownerId: number) {
        const branches = await this.findAll({
            ownerId,
            status: BranchStatus.Active,
        });

        // Placeholder for cross-branch statistics
        // In a real implementation, this would aggregate data from appointments, revenue, etc.
        return {
            totalBranches: branches.length,
            branches: branches.map((b) => ({
                id: b.id,
                name: b.name,
                city: b.city,
                status: b.status,
                // Add more stats per branch as needed
            })),
        };
    }

    // Helpers
    private generateSlug(name: string): string {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .substring(0, 100);
    }
}
