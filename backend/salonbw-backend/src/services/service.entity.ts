import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { ColumnNumericTransformer } from '../column-numeric.transformer';

@Entity('services')
export class Service {
    @ApiProperty()
    @PrimaryGeneratedColumn()
    id: number;

    @ApiProperty()
    @Column()
    name: string;

    @ApiProperty()
    @Column()
    description: string;

    @ApiProperty()
    @Column('int')
    duration: number;

    @ApiProperty()
    @Column('decimal', { transformer: new ColumnNumericTransformer() })
    price: number;

    @ApiProperty({ required: false })
    @Column({ nullable: true })
    category?: string;

    @ApiProperty({ required: false })
    @Column('decimal', {
        nullable: true,
        transformer: new ColumnNumericTransformer(),
    })
    commissionPercent?: number;
}
