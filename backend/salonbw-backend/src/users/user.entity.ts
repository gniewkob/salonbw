import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Role } from './role.enum';
import { ColumnNumericTransformer } from '../column-numeric.transformer';
import { ApiHideProperty } from '@nestjs/swagger';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    email: string;

    @ApiHideProperty()
    @Column({ select: false })
    password: string;

    @Column()
    name: string;

    @Column({ type: 'simple-enum', enum: Role, default: Role.Client })
    role: Role;

    @Column({ type: 'varchar', nullable: true })
    phone: string | null;

    @Column({ default: true })
    receiveNotifications: boolean;

    @Column('decimal', {
        transformer: new ColumnNumericTransformer(),
        default: 0,
    })
    commissionBase: number;
}
