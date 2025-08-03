import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../users/role.enum';

export class EmployeeDto {
    @ApiProperty()
    @Expose()
    id: number;

    @ApiProperty()
    @Expose()
    email: string;

    @ApiProperty()
    @Expose()
    firstName: string;

    @ApiProperty()
    @Expose()
    lastName: string;

    @ApiProperty()
    @Expose()
    get fullName(): string {
        return `${this.firstName} ${this.lastName}`.trim();
    }

    @ApiProperty({ nullable: true })
    @Expose()
    phone: string | null;

    @ApiProperty({ enum: Role })
    @Expose()
    role: Role;

    @ApiProperty()
    @Expose()
    commissionBase: number;
}
