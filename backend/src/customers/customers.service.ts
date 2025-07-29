import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { Customer } from './customer.entity';
import { Role } from '../users/role.enum';
import { CustomerDto } from './dto/customer.dto';

@Injectable()
export class CustomersService {
    constructor(
        @InjectRepository(Customer)
        private readonly repo: Repository<Customer>,
    ) {}

    async findAll(): Promise<CustomerDto[]> {
        const customers = await this.repo.find({
            where: { role: Role.Client },
        });
        return plainToInstance(CustomerDto, customers, {
            excludeExtraneousValues: true,
        });
    }

    async findOne(id: number): Promise<CustomerDto | undefined> {
        const customer = await this.repo.findOne({
            where: { id, role: Role.Client },
        });
        if (!customer) return undefined;
        return plainToInstance(CustomerDto, customer, {
            excludeExtraneousValues: true,
        });
    }
}
