import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './customer.entity';
import { Role } from '../users/role.enum';

@Injectable()
export class CustomersService {
    constructor(
        @InjectRepository(Customer)
        private readonly repo: Repository<Customer>,
    ) {}

    findAll() {
        return this.repo.find({ where: { role: Role.Client } });
    }

    findOne(id: number) {
        return this.repo.findOne({ where: { id, role: Role.Client } });
    }
}
