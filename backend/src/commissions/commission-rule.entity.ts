import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, Index } from 'typeorm';
import { User } from '../users/user.entity';

export enum CommissionTargetType {
    Service = 'service',
    Category = 'category',
    Product = 'product',
}

@Index(['employee', 'targetType', 'targetId'])
@Entity()
export class CommissionRule {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, { onDelete: 'RESTRICT' })
    employee: User;

    @Column({ type: 'enum', enum: CommissionTargetType })
    targetType: CommissionTargetType;

    @Column('int')
    targetId: number;

    @Column('float')
    commissionPercent: number;
}
