import {
    Injectable,
    NotFoundException,
    ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';
import { EmployeeService } from './entities/employee-service.entity';
import { Service } from './service.entity';
import { ServiceVariant } from './entities/service-variant.entity';
import { User } from '../users/user.entity';
import {
    CreateEmployeeServiceDto,
    UpdateEmployeeServiceDto,
    AssignEmployeesToServiceDto,
    AssignServicesToEmployeeDto,
} from './dto/employee-service.dto';
import { AppCacheService } from '../cache/cache.service';

const employeeServicesCacheKey = (employeeId: number) =>
    `employee-services:employee:${employeeId}`;
const serviceEmployeesCacheKey = (serviceId: number) =>
    `employee-services:service:${serviceId}`;

@Injectable()
export class EmployeeServicesService {
    constructor(
        @InjectRepository(EmployeeService)
        private readonly employeeServiceRepository: Repository<EmployeeService>,
        @InjectRepository(Service)
        private readonly serviceRepository: Repository<Service>,
        @InjectRepository(ServiceVariant)
        private readonly serviceVariantRepository: Repository<ServiceVariant>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly cache: AppCacheService,
    ) {}

    async create(dto: CreateEmployeeServiceDto): Promise<EmployeeService> {
        // Check if assignment already exists
        const existing = await this.employeeServiceRepository.findOne({
            where: {
                employeeId: dto.employeeId,
                serviceId: dto.serviceId,
                serviceVariantId:
                    dto.serviceVariantId === null || dto.serviceVariantId === undefined
                        ? IsNull()
                        : dto.serviceVariantId,
            },
        });
        if (existing) {
            throw new ConflictException(
                'Employee is already assigned to this service',
            );
        }

        // Verify employee exists
        const employee = await this.userRepository.findOne({
            where: { id: dto.employeeId },
        });
        if (!employee) {
            throw new NotFoundException('Employee not found');
        }

        // Verify service exists
        const service = await this.serviceRepository.findOne({
            where: { id: dto.serviceId },
        });
        if (!service) {
            throw new NotFoundException('Service not found');
        }

        if (dto.serviceVariantId) {
            const variant = await this.serviceVariantRepository.findOne({
                where: { id: dto.serviceVariantId },
            });
            if (!variant || variant.serviceId !== service.id) {
                throw new NotFoundException('Service variant not found');
            }
        }

        const assignment = this.employeeServiceRepository.create(dto);
        const saved = await this.employeeServiceRepository.save(assignment);
        await this.invalidateCache(dto.employeeId, dto.serviceId);
        return saved;
    }

    async findByEmployee(employeeId: number): Promise<EmployeeService[]> {
        return this.cache.wrap<EmployeeService[]>(
            employeeServicesCacheKey(employeeId),
            () =>
                this.employeeServiceRepository.find({
                    where: { employeeId },
                    relations: ['service', 'service.categoryRelation', 'serviceVariant'],
                }),
        );
    }

    async findByService(serviceId: number): Promise<EmployeeService[]> {
        return this.cache.wrap<EmployeeService[]>(
            serviceEmployeesCacheKey(serviceId),
            () =>
                this.employeeServiceRepository.find({
                    where: { serviceId },
                    relations: ['employee', 'serviceVariant'],
                }),
        );
    }

    async findServicesForEmployee(employeeId: number): Promise<Service[]> {
        const assignments = await this.findByEmployee(employeeId);
        return assignments
            .filter((a) => a.isActive && a.service)
            .map((a) => ({
                ...a.service,
                duration:
                    a.customDuration ??
                    a.serviceVariant?.duration ??
                    a.service.duration,
                price:
                    a.customPrice ??
                    a.serviceVariant?.price ??
                    a.service.price,
            })) as Service[];
    }

    async findOne(id: number): Promise<EmployeeService> {
        const assignment = await this.employeeServiceRepository.findOne({
            where: { id },
            relations: ['employee', 'service'],
        });

        if (!assignment) {
            throw new NotFoundException('Employee-service assignment not found');
        }

        return assignment;
    }

    async update(
        id: number,
        dto: UpdateEmployeeServiceDto,
    ): Promise<EmployeeService> {
        const assignment = await this.findOne(id);
        await this.employeeServiceRepository.update(id, dto);
        await this.invalidateCache(assignment.employeeId, assignment.serviceId);
        return this.findOne(id);
    }

    async remove(id: number): Promise<void> {
        const assignment = await this.findOne(id);
        await this.employeeServiceRepository.delete(id);
        await this.invalidateCache(assignment.employeeId, assignment.serviceId);
    }

    async assignEmployeesToService(
        serviceId: number,
        dto: AssignEmployeesToServiceDto,
    ): Promise<EmployeeService[]> {
        const service = await this.serviceRepository.findOne({
            where: { id: serviceId },
        });
        if (!service) {
            throw new NotFoundException('Service not found');
        }

        if (dto.serviceVariantId) {
            const variant = await this.serviceVariantRepository.findOne({
                where: { id: dto.serviceVariantId },
            });
            if (!variant || variant.serviceId !== serviceId) {
                throw new NotFoundException('Service variant not found');
            }
        }

        // Get existing assignments
        const existing = await this.employeeServiceRepository.find({
            where: {
                serviceId,
                serviceVariantId:
                    dto.serviceVariantId === null || dto.serviceVariantId === undefined
                        ? IsNull()
                        : dto.serviceVariantId,
            },
        });
        const existingEmployeeIds = new Set(existing.map((e) => e.employeeId));

        // Add new assignments
        const newAssignments: EmployeeService[] = [];
        for (const employeeId of dto.employeeIds) {
            if (!existingEmployeeIds.has(employeeId)) {
                const assignment = this.employeeServiceRepository.create({
                    employeeId,
                    serviceId,
                    serviceVariantId: dto.serviceVariantId ?? null,
                });
                newAssignments.push(assignment);
            }
        }

        if (newAssignments.length > 0) {
            await this.employeeServiceRepository.save(newAssignments);
        }

        // Remove unassigned employees
        const toRemove = existing.filter(
            (e) => !dto.employeeIds.includes(e.employeeId),
        );
        if (toRemove.length > 0) {
            await this.employeeServiceRepository.delete(toRemove.map((e) => e.id));
        }

        // Invalidate cache for all affected employees
        const allEmployeeIds = [
            ...dto.employeeIds,
            ...toRemove.map((e) => e.employeeId),
        ];
        await Promise.all([
            this.cache.del(serviceEmployeesCacheKey(serviceId)),
            ...allEmployeeIds.map((eid) =>
                this.cache.del(employeeServicesCacheKey(eid)),
            ),
        ]);

        return this.findByService(serviceId);
    }

    async assignServicesToEmployee(
        employeeId: number,
        dto: AssignServicesToEmployeeDto,
    ): Promise<EmployeeService[]> {
        const employee = await this.userRepository.findOne({
            where: { id: employeeId },
        });
        if (!employee) {
            throw new NotFoundException('Employee not found');
        }

        // Get existing assignments
        const existing = await this.employeeServiceRepository.find({
            where: { employeeId },
        });
        const existingServiceIds = new Set(existing.map((e) => e.serviceId));

        // Add new assignments
        const newAssignments: EmployeeService[] = [];
        for (const serviceId of dto.serviceIds) {
            if (!existingServiceIds.has(serviceId)) {
                const assignment = this.employeeServiceRepository.create({
                    employeeId,
                    serviceId,
                });
                newAssignments.push(assignment);
            }
        }

        if (newAssignments.length > 0) {
            await this.employeeServiceRepository.save(newAssignments);
        }

        // Remove unassigned services
        const toRemove = existing.filter(
            (e) => !dto.serviceIds.includes(e.serviceId),
        );
        if (toRemove.length > 0) {
            await this.employeeServiceRepository.delete(toRemove.map((e) => e.id));
        }

        // Invalidate cache
        const allServiceIds = [
            ...dto.serviceIds,
            ...toRemove.map((e) => e.serviceId),
        ];
        await Promise.all([
            this.cache.del(employeeServicesCacheKey(employeeId)),
            ...allServiceIds.map((sid) =>
                this.cache.del(serviceEmployeesCacheKey(sid)),
            ),
        ]);

        return this.findByEmployee(employeeId);
    }

    private async invalidateCache(
        employeeId: number,
        serviceId: number,
    ): Promise<void> {
        await Promise.all([
            this.cache.del(employeeServicesCacheKey(employeeId)),
            this.cache.del(serviceEmployeesCacheKey(serviceId)),
        ]);
    }
}
