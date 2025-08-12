import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ColumnNumericTransformer } from '../column-numeric.transformer';

@Entity('services')
export class Service {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    description: string;

    @Column('int')
    duration: number;

    @Column('decimal', { transformer: new ColumnNumericTransformer() })
    price: number;

    @Column({ nullable: true })
    category?: string;

    @Column('decimal', {
        nullable: true,
        transformer: new ColumnNumericTransformer(),
    })
    commissionPercent?: number;
}
