import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { User } from '../users/user.entity';
import { Role } from '../users/role.enum';
import { EmployeeDto } from './dto/employee.dto';

@Injectable()
export class EmployeesService {
    constructor(
        @InjectRepository(User)
        private readonly repo: Repository<User>,
    ) {}

    async findAll(): Promise<EmployeeDto[]> {
        const employees = await this.repo.find({
            where: [{ role: Role.Employee }, { role: Role.Admin }],
        });
        return plainToInstance(EmployeeDto, employees, {
            excludeExtraneousValues: true,
        });
    }

    async findOne(id: number): Promise<EmployeeDto | undefined> {
        const employee = await this.repo.findOne({
            where: [
                { id, role: Role.Employee },
                { id, role: Role.Admin },
            ],
        });
        if (!employee) return undefined;
        return plainToInstance(EmployeeDto, employee, {
            excludeExtraneousValues: true,
        });
    }
}
