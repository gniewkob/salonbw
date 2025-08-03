import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { Customer } from './customer.entity';
import { Role } from '../users/role.enum';
import { CustomerDto } from './dto/customer.dto';
import { UsersService } from '../users/users.service';
import { UpdateCustomerDto } from '../users/dto/update-customer.dto';

@Injectable()
export class CustomersService {
    constructor(
        @InjectRepository(Customer)
        private readonly repo: Repository<Customer>,
        private readonly users: UsersService,
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

    async setActive(
        id: number,
        isActive: boolean,
    ): Promise<CustomerDto | undefined> {
        const customer = await this.repo.findOne({
            where: { id, role: Role.Client },
        });
        if (!customer) return undefined;
        customer.isActive = isActive;
        const saved = await this.repo.save(customer);
        return plainToInstance(CustomerDto, saved, {
            excludeExtraneousValues: true,
        });
    }

    async updateMarketingConsent(
        id: number,
        marketingConsent: boolean,
    ): Promise<CustomerDto | undefined> {
        const customer = await this.repo.findOne({
            where: { id, role: Role.Client },
        });
        if (!customer) return undefined;
        customer.marketingConsent = marketingConsent;
        const saved = await this.repo.save(customer);
        return plainToInstance(CustomerDto, saved, {
            excludeExtraneousValues: true,
        });
    }

    async updateProfile(
        id: number,
        dto: UpdateCustomerDto,
    ): Promise<CustomerDto> {
        const existing = await this.repo.findOne({
            where: { id, role: Role.Client },
        });
        if (!existing) {
            throw new NotFoundException();
        }
        await this.users.updateCustomer(id, dto);
        const updated = await this.repo.findOne({
            where: { id, role: Role.Client },
        });
        if (!updated) {
            throw new NotFoundException();
        }
        return plainToInstance(CustomerDto, updated, {
            excludeExtraneousValues: true,
        });
    }
}
