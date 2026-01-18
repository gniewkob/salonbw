import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Role } from './role.enum';
import { ColumnNumericTransformer } from '../column-numeric.transformer';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';

@Entity('users')
export class User {
    @ApiProperty()
    @PrimaryGeneratedColumn()
    id: number;

    @ApiProperty()
    @Column({ unique: true })
    email: string;

    @ApiHideProperty()
    @Column({ select: false })
    password: string;

    @ApiProperty()
    @Column()
    name: string;

    @ApiProperty({ enum: Role })
    @Column({ type: 'simple-enum', enum: Role, default: Role.Client })
    role: Role;

    @ApiProperty({ required: false })
    @Column({ type: 'varchar', nullable: true })
    phone: string | null;

    @ApiProperty()
    @Column({ default: true })
    receiveNotifications: boolean;

    @ApiProperty()
    @Column('decimal', {
        transformer: new ColumnNumericTransformer(),
        default: 0,
    })
    commissionBase: number;
}
