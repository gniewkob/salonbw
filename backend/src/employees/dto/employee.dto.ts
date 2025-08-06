import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../users/role.enum';

export class EmployeeDto {
    @ApiProperty({
        description: 'Unique identifier of the employee',
        type: Number,
        example: 1,
    })
    @Expose()
    id: number;

    @ApiProperty({
        description: 'Employee email address',
        type: String,
        example: 'employee@example.com',
    })
    @Expose()
    email: string;

    @ApiProperty({
        description: 'First name of the employee',
        type: String,
        example: 'Jane',
    })
    @Expose()
    firstName: string;

    @ApiProperty({
        description: 'Last name of the employee',
        type: String,
        example: 'Doe',
    })
    @Expose()
    lastName: string;

    @ApiProperty({
        description: 'Full name of the employee',
        type: String,
        example: 'Jane Doe',
    })
    @Expose()
    get fullName(): string {
        return `${this.firstName} ${this.lastName}`.trim();
    }

    @ApiProperty({
        description: 'Contact phone number',
        type: String,
        nullable: true,
        example: '+48123123123',
    })
    @Expose()
    phone: string | null;

    @ApiProperty({
        description: 'Role of the employee',
        enum: Role,
        example: Role.Employee,
    })
    @Expose()
    role: Role;

    @ApiProperty({
        description: 'Base commission percentage',
        type: Number,
        example: 20,
    })
    @Expose()
    commissionBase: number;
}
