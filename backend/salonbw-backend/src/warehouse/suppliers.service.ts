import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from './entities/supplier.entity';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/supplier.dto';
import { LogService } from '../logs/log.service';
import { LogAction } from '../logs/log-action.enum';
import { User } from '../users/user.entity';

@Injectable()
export class SuppliersService {
    constructor(
        @InjectRepository(Supplier)
        private readonly supplierRepository: Repository<Supplier>,
        private readonly logService: LogService,
    ) {}

    async findAll(includeInactive = false): Promise<Supplier[]> {
        const where = includeInactive ? {} : { isActive: true };
        return this.supplierRepository.find({
            where,
            order: { name: 'ASC' },
        });
    }

    async findOne(id: number): Promise<Supplier> {
        const supplier = await this.supplierRepository.findOne({
            where: { id },
        });
        if (!supplier) {
            throw new NotFoundException(`Dostawca o ID ${id} nie został znaleziony`);
        }
        return supplier;
    }

    async create(dto: CreateSupplierDto, actor: User): Promise<Supplier> {
        const supplier = this.supplierRepository.create(dto);
        const saved = await this.supplierRepository.save(supplier);

        await this.logService.logAction(actor, LogAction.SUPPLIER_CREATED, {
            entity: 'supplier',
            supplierId: saved.id,
            name: dto.name,
        });

        return saved;
    }

    async update(id: number, dto: UpdateSupplierDto, actor: User): Promise<Supplier> {
        const supplier = await this.findOne(id);
        Object.assign(supplier, dto);
        const saved = await this.supplierRepository.save(supplier);

        await this.logService.logAction(actor, LogAction.SUPPLIER_UPDATED, {
            entity: 'supplier',
            supplierId: saved.id,
            changes: dto,
        });

        return saved;
    }

    async remove(id: number, actor: User): Promise<void> {
        const supplier = await this.findOne(id);
        await this.supplierRepository.remove(supplier);

        await this.logService.logAction(actor, LogAction.SUPPLIER_DELETED, {
            entity: 'supplier',
            supplierId: id,
            name: supplier.name,
        });
    }
}
