import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../users/role.enum';

export class CustomerDto {
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

    @ApiProperty({ nullable: true })
    @Expose()
    phone: string | null;

    @ApiProperty({ enum: Role })
    @Expose()
    role: Role;

    @ApiProperty()
    @Expose()
    privacyConsent: boolean;

    @ApiProperty()
    @Expose()
    marketingConsent: boolean;

    @ApiProperty()
    @Expose()
    createdAt: Date;

    @ApiProperty()
    @Expose()
    updatedAt: Date;

    @ApiProperty()
    @Expose()
    isActive: boolean;
}
