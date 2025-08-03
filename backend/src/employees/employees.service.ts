import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { User } from '../users/user.entity';
import { Role } from '../users/role.enum';
import { EmployeeDto } from './dto/employee.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

@Injectable()
export class EmployeesService {
    constructor(
        @InjectRepository(User)
        private readonly repo: Repository<User>,
    ) {}

    private toDto(user: User): EmployeeDto {
        return plainToInstance(
            EmployeeDto,
            { ...user, name: `${user.firstName} ${user.lastName}` },
            { excludeExtraneousValues: true },
        );
    }

    async findAll(): Promise<EmployeeDto[]> {
        const employees = await this.repo.find({
            where: [{ role: Role.Employee }, { role: Role.Admin }],
        });
        return employees.map((e) => this.toDto(e));
    }

    async findOne(id: number): Promise<EmployeeDto | undefined> {
        const employee = await this.repo.findOne({
            where: [
                { id, role: Role.Employee },
                { id, role: Role.Admin },
            ],
        });
        if (!employee) return undefined;
        return this.toDto(employee);
    }

    async create(
        dto: CreateEmployeeDto,
    ): Promise<{ employee: EmployeeDto; password: string }> {
        const existing = await this.repo.findOne({
            where: { email: dto.email },
        });
        if (existing) {
            throw new BadRequestException('Email already registered');
        }
        const password = randomBytes(8).toString('hex');
        const hashed = await bcrypt.hash(password, 10);
        const user = this.repo.create({
            email: dto.email,
            password: hashed,
            firstName: dto.firstName,
            lastName: dto.lastName,
            phone: dto.phone ?? null,
            role: dto.role ?? Role.Employee,
        });
        const saved = await this.repo.save(user);
        return { employee: this.toDto(saved), password };
    }

    async update(
        id: number,
        dto: UpdateEmployeeDto,
    ): Promise<EmployeeDto | undefined> {
        const employee = await this.repo.findOne({
            where: [
                { id, role: Role.Employee },
                { id, role: Role.Admin },
            ],
        });
        if (!employee) return undefined;
        if (dto.email && dto.email !== employee.email) {
            const existing = await this.repo.findOne({
                where: { email: dto.email },
            });
            if (existing && existing.id !== id) {
                throw new BadRequestException('Email already registered');
            }
            employee.email = dto.email;
        }
        if (dto.firstName !== undefined) {
            employee.firstName = dto.firstName;
        }
        if (dto.lastName !== undefined) {
            employee.lastName = dto.lastName;
        }
        if (dto.phone !== undefined) {
            employee.phone = dto.phone;
        }
        if (dto.role !== undefined) {
            employee.role = dto.role;
        }
        const saved = await this.repo.save(employee);
        return this.toDto(saved);
    }

    async setActive(
        id: number,
        isActive: boolean,
    ): Promise<EmployeeDto | undefined> {
        const employee = await this.repo.findOne({
            where: [
                { id, role: Role.Employee },
                { id, role: Role.Admin },
            ],
        });
        if (!employee) return undefined;
        employee.isActive = isActive;
        const saved = await this.repo.save(employee);
        return this.toDto(saved);
    }

    async setCommissionBase(
        id: number,
        commissionBase: number,
    ): Promise<EmployeeDto | undefined> {
        const employee = await this.repo.findOne({
            where: [
                { id, role: Role.Employee },
                { id, role: Role.Admin },
            ],
        });
        if (!employee) return undefined;
        employee.commissionBase = commissionBase;
        const saved = await this.repo.save(employee);
        return this.toDto(saved);
    }

    async remove(id: number): Promise<boolean> {
        const employee = await this.repo.findOne({
            where: [
                { id, role: Role.Employee },
                { id, role: Role.Admin },
            ],
        });
        if (!employee) return false;
        await this.repo.softDelete(id);
        return true;
    }
}
