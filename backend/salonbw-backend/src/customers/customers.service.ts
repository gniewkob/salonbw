import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, In } from 'typeorm';
import { User } from '../users/user.entity';
import { Role } from '../users/role.enum';
import { Appointment, AppointmentStatus } from '../appointments/appointment.entity';
import { CustomerGroup } from './entities/customer-group.entity';
import { CustomerNote } from './entities/customer-note.entity';
import { CustomerTag } from './entities/customer-tag.entity';
import {
    CustomerFilterDto,
    CreateCustomerDto,
    UpdateCustomerDto,
} from './dto/customer-filter.dto';
import {
    CreateCustomerGroupDto,
    UpdateCustomerGroupDto,
} from './dto/customer-group.dto';
import { CreateCustomerNoteDto, UpdateCustomerNoteDto } from './dto/customer-note.dto';
import { CreateCustomerTagDto, UpdateCustomerTagDto } from './dto/customer-tag.dto';

@Injectable()
export class CustomersService {
    constructor(
        @InjectRepository(User)
        private readonly usersRepo: Repository<User>,
        @InjectRepository(Appointment)
        private readonly appointmentsRepo: Repository<Appointment>,
        @InjectRepository(CustomerGroup)
        private readonly groupsRepo: Repository<CustomerGroup>,
        @InjectRepository(CustomerNote)
        private readonly notesRepo: Repository<CustomerNote>,
        @InjectRepository(CustomerTag)
        private readonly tagsRepo: Repository<CustomerTag>,
    ) {}

    // ==================== CUSTOMERS ====================

    async findAll(filter: CustomerFilterDto) {
        const {
            search,
            gender,
            ageMin,
            ageMax,
            groupId,
            tagId,
            spentMin,
            spentMax,
            hasVisitSince,
            noVisitSince,
            smsConsent,
            emailConsent,
            page = 1,
            limit = 20,
            sortBy = 'name',
            sortOrder = 'ASC',
        } = filter;

        let query = this.usersRepo
            .createQueryBuilder('user')
            .where('user.role = :role', { role: Role.Client });

        // Search by name or phone
        if (search) {
            query = query.andWhere(
                '(user.name ILIKE :search OR user.phone ILIKE :search OR user.firstName ILIKE :search OR user.lastName ILIKE :search)',
                { search: `%${search}%` },
            );
        }

        // Gender filter
        if (gender) {
            query = query.andWhere('user.gender = :gender', { gender });
        }

        // Age filter (requires birthDate)
        if (ageMin !== undefined || ageMax !== undefined) {
            const now = new Date();
            if (ageMin !== undefined) {
                const maxBirthDate = new Date(
                    now.getFullYear() - ageMin,
                    now.getMonth(),
                    now.getDate(),
                );
                query = query.andWhere('user.birthDate <= :maxBirthDate', {
                    maxBirthDate,
                });
            }
            if (ageMax !== undefined) {
                const minBirthDate = new Date(
                    now.getFullYear() - ageMax - 1,
                    now.getMonth(),
                    now.getDate(),
                );
                query = query.andWhere('user.birthDate >= :minBirthDate', {
                    minBirthDate,
                });
            }
        }

        // SMS consent
        if (smsConsent !== undefined) {
            query = query.andWhere('user.smsConsent = :smsConsent', { smsConsent });
        }

        // Email consent
        if (emailConsent !== undefined) {
            query = query.andWhere('user.emailConsent = :emailConsent', {
                emailConsent,
            });
        }

        // Group filter
        if (groupId) {
            query = query
                .innerJoin('customer_group_members', 'cgm', 'cgm.userId = user.id')
                .andWhere('cgm.groupId = :groupId', { groupId });
        }

        // Tag filter
        if (tagId) {
            query = query
                .innerJoin('customer_tag_assignments', 'cta', 'cta.userId = user.id')
                .andWhere('cta.tagId = :tagId', { tagId });
        }

        // Spending filters require subquery
        if (spentMin !== undefined || spentMax !== undefined) {
            const spendingSubquery = this.appointmentsRepo
                .createQueryBuilder('apt')
                .select('apt.clientId')
                .addSelect('SUM(COALESCE(apt.paidAmount, 0))', 'totalSpent')
                .where('apt.status = :completedStatus', {
                    completedStatus: AppointmentStatus.Completed,
                })
                .groupBy('apt.clientId');

            if (spentMin !== undefined) {
                spendingSubquery.having('SUM(COALESCE(apt.paidAmount, 0)) >= :spentMin', {
                    spentMin,
                });
            }
            if (spentMax !== undefined) {
                spendingSubquery.having('SUM(COALESCE(apt.paidAmount, 0)) <= :spentMax', {
                    spentMax,
                });
            }

            query = query.andWhere(
                `user.id IN (${spendingSubquery.getQuery()})`,
            );
            query.setParameters(spendingSubquery.getParameters());
        }

        // Visit date filters
        if (hasVisitSince) {
            const visitSubquery = this.appointmentsRepo
                .createQueryBuilder('apt')
                .select('apt.clientId')
                .where('apt.startTime >= :hasVisitSince', { hasVisitSince })
                .andWhere('apt.status = :completedStatus', {
                    completedStatus: AppointmentStatus.Completed,
                });

            query = query.andWhere(`user.id IN (${visitSubquery.getQuery()})`);
            query.setParameters(visitSubquery.getParameters());
        }

        if (noVisitSince) {
            const noVisitSubquery = this.appointmentsRepo
                .createQueryBuilder('apt')
                .select('apt.clientId')
                .where('apt.startTime >= :noVisitSince', { noVisitSince })
                .andWhere('apt.status = :completedStatus', {
                    completedStatus: AppointmentStatus.Completed,
                });

            query = query.andWhere(`user.id NOT IN (${noVisitSubquery.getQuery()})`);
            query.setParameters(noVisitSubquery.getParameters());
        }

        // Sorting
        const allowedSortFields = ['name', 'email', 'createdAt', 'firstName', 'lastName'];
        const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'name';
        query = query.orderBy(`user.${safeSortBy}`, sortOrder);

        // Pagination
        const offset = (page - 1) * limit;
        const [items, total] = await query
            .skip(offset)
            .take(limit)
            .getManyAndCount();

        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async findOne(id: number) {
        const customer = await this.usersRepo.findOne({
            where: { id, role: Role.Client },
        });
        if (!customer) {
            throw new NotFoundException('Customer not found');
        }
        return customer;
    }

    async create(dto: CreateCustomerDto) {
        const email = dto.email || this.generateEmail(dto.firstName, dto.lastName);
        const password = this.generatePassword();
        const name =
            dto.firstName && dto.lastName
                ? `${dto.firstName} ${dto.lastName}`
                : dto.firstName || dto.lastName || 'New Customer';

        const customer = this.usersRepo.create({
            email,
            password,
            name,
            role: Role.Client,
            ...dto,
        });

        return this.usersRepo.save(customer);
    }

    async update(id: number, dto: UpdateCustomerDto) {
        const customer = await this.findOne(id);

        // Update name if firstName or lastName changed
        if (dto.firstName !== undefined || dto.lastName !== undefined) {
            const firstName = dto.firstName ?? customer.firstName ?? '';
            const lastName = dto.lastName ?? customer.lastName ?? '';
            const newName = `${firstName} ${lastName}`.trim() || customer.name;
            Object.assign(customer, dto, { name: newName });
        } else {
            Object.assign(customer, dto);
        }

        return this.usersRepo.save(customer);
    }

    // ==================== GROUPS ====================

    async findAllGroups() {
        return this.groupsRepo.find({
            relations: ['members'],
            order: { name: 'ASC' },
        });
    }

    async findOneGroup(id: number) {
        const group = await this.groupsRepo.findOne({
            where: { id },
            relations: ['members'],
        });
        if (!group) {
            throw new NotFoundException('Group not found');
        }
        return group;
    }

    async createGroup(dto: CreateCustomerGroupDto) {
        const group = this.groupsRepo.create({
            name: dto.name,
            description: dto.description,
            color: dto.color,
        });

        if (dto.memberIds?.length) {
            group.members = await this.usersRepo.findBy({
                id: In(dto.memberIds),
                role: Role.Client,
            });
        }

        return this.groupsRepo.save(group);
    }

    async updateGroup(id: number, dto: UpdateCustomerGroupDto) {
        const group = await this.findOneGroup(id);

        if (dto.name !== undefined) group.name = dto.name;
        if (dto.description !== undefined) group.description = dto.description;
        if (dto.color !== undefined) group.color = dto.color;

        if (dto.memberIds !== undefined) {
            group.members = await this.usersRepo.findBy({
                id: In(dto.memberIds),
                role: Role.Client,
            });
        }

        return this.groupsRepo.save(group);
    }

    async deleteGroup(id: number) {
        const group = await this.findOneGroup(id);
        await this.groupsRepo.remove(group);
        return { success: true };
    }

    async addMembersToGroup(groupId: number, customerIds: number[]) {
        const group = await this.findOneGroup(groupId);
        const newMembers = await this.usersRepo.findBy({
            id: In(customerIds),
            role: Role.Client,
        });

        const existingIds = new Set(group.members.map((m) => m.id));
        const toAdd = newMembers.filter((m) => !existingIds.has(m.id));
        group.members = [...group.members, ...toAdd];

        return this.groupsRepo.save(group);
    }

    async removeMemberFromGroup(groupId: number, customerId: number) {
        const group = await this.findOneGroup(groupId);
        group.members = group.members.filter((m) => m.id !== customerId);
        return this.groupsRepo.save(group);
    }

    // ==================== NOTES ====================

    async findNotesForCustomer(customerId: number) {
        return this.notesRepo.find({
            where: { customer: { id: customerId } },
            relations: ['createdBy'],
            order: { isPinned: 'DESC', createdAt: 'DESC' },
        });
    }

    async createNote(customerId: number, dto: CreateCustomerNoteDto, createdById?: number) {
        await this.findOne(customerId); // Verify customer exists

        const note = this.notesRepo.create({
            ...dto,
            customer: { id: customerId },
            createdBy: createdById ? { id: createdById } : undefined,
        });

        return this.notesRepo.save(note);
    }

    async updateNote(noteId: number, dto: UpdateCustomerNoteDto) {
        const note = await this.notesRepo.findOne({ where: { id: noteId } });
        if (!note) {
            throw new NotFoundException('Note not found');
        }

        Object.assign(note, dto);
        return this.notesRepo.save(note);
    }

    async deleteNote(noteId: number) {
        const note = await this.notesRepo.findOne({ where: { id: noteId } });
        if (!note) {
            throw new NotFoundException('Note not found');
        }

        await this.notesRepo.remove(note);
        return { success: true };
    }

    // ==================== TAGS ====================

    async findAllTags() {
        return this.tagsRepo.find({ order: { name: 'ASC' } });
    }

    async createTag(dto: CreateCustomerTagDto) {
        const tag = this.tagsRepo.create(dto);
        return this.tagsRepo.save(tag);
    }

    async updateTag(id: number, dto: UpdateCustomerTagDto) {
        const tag = await this.tagsRepo.findOne({ where: { id } });
        if (!tag) {
            throw new NotFoundException('Tag not found');
        }

        Object.assign(tag, dto);
        return this.tagsRepo.save(tag);
    }

    async deleteTag(id: number) {
        const tag = await this.tagsRepo.findOne({ where: { id } });
        if (!tag) {
            throw new NotFoundException('Tag not found');
        }

        await this.tagsRepo.remove(tag);
        return { success: true };
    }

    async assignTagsToCustomer(customerId: number, tagIds: number[]) {
        const customer = await this.findOne(customerId);
        const tags = await this.tagsRepo.findBy({ id: In(tagIds) });

        // Add customer to each tag
        for (const tag of tags) {
            const tagWithCustomers = await this.tagsRepo.findOne({
                where: { id: tag.id },
                relations: ['customers'],
            });
            if (tagWithCustomers) {
                const existingIds = new Set(tagWithCustomers.customers.map((c) => c.id));
                if (!existingIds.has(customerId)) {
                    tagWithCustomers.customers.push(customer);
                    await this.tagsRepo.save(tagWithCustomers);
                }
            }
        }

        return { success: true };
    }

    async removeTagFromCustomer(customerId: number, tagId: number) {
        const tag = await this.tagsRepo.findOne({
            where: { id: tagId },
            relations: ['customers'],
        });
        if (!tag) {
            throw new NotFoundException('Tag not found');
        }

        tag.customers = tag.customers.filter((c) => c.id !== customerId);
        await this.tagsRepo.save(tag);
        return { success: true };
    }

    async getTagsForCustomer(customerId: number) {
        const tags = await this.tagsRepo
            .createQueryBuilder('tag')
            .innerJoin('customer_tag_assignments', 'cta', 'cta.tagId = tag.id')
            .where('cta.userId = :customerId', { customerId })
            .getMany();
        return tags;
    }

    // ==================== HELPERS ====================

    private generateEmail(firstName?: string, lastName?: string): string {
        const slug = [firstName, lastName]
            .filter(Boolean)
            .join('.')
            .toLowerCase()
            .replace(/\s+/g, '.')
            .replace(/[^a-z0-9.]/g, '');
        return `client.${slug || 'customer'}.${Date.now()}@local.invalid`;
    }

    private generatePassword(): string {
        return (
            Math.random().toString(36).slice(2) +
            Math.random().toString(36).slice(2)
        );
    }
}
