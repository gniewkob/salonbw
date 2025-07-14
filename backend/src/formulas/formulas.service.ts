import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Formula } from './formula.entity';

@Injectable()
export class FormulasService {
    constructor(
        @InjectRepository(Formula)
        private readonly repo: Repository<Formula>,
    ) {}

    create(clientId: number, description: string, appointmentId?: number) {
        const formula = this.repo.create({
            client: { id: clientId } as any,
            description,
            appointment: appointmentId ? ({ id: appointmentId } as any) : null,
        });
        return this.repo.save(formula);
    }

    findForUser(clientId: number) {
        return this.repo.find({
            where: { client: { id: clientId } },
            order: { id: 'ASC' },
        });
    }
}
