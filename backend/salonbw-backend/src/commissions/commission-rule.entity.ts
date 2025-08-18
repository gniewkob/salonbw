import { Entity, PrimaryGeneratedColumn, ManyToOne, Column } from 'typeorm';
import { ColumnNumericTransformer } from '../column-numeric.transformer';
import { User } from '../users/user.entity';
import { Service } from '../services/service.entity';

@Entity('commission_rules')
export class CommissionRule {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, { eager: true })
    employee: User;

    @ManyToOne(() => Service, { nullable: true, eager: true })
    service?: Service | null;

    @Column('text', { nullable: true })
    category?: string | null;

    @Column('decimal', { transformer: new ColumnNumericTransformer() })
    commissionPercent: number;
}
