import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Communication } from './communication.entity';

@Injectable()
export class CommunicationsService {
    constructor(
        @InjectRepository(Communication)
        private readonly repo: Repository<Communication>,
    ) {}

    create(customerId: number, medium: string, content: string) {
        const comm = this.repo.create({
            customer: { id: customerId } as any,
            medium,
            content,
        });
        return this.repo.save(comm);
    }

    findForCustomer(customerId: number) {
        return this.repo.find({ where: { customer: { id: customerId } } });
    }
}
