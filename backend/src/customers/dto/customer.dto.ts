import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../users/role.enum';

export class CustomerDto {
    @ApiProperty({
        description: 'Unique identifier of the customer',
        type: Number,
        example: 1,
    })
    @Expose()
    id: number;

    @ApiProperty({
        description: 'Customer email address',
        type: String,
        example: 'jan@example.com',
    })
    @Expose()
    email: string;

    @ApiProperty({
        description: 'First name of the customer',
        type: String,
        example: 'Jan',
    })
    @Expose()
    firstName: string;

    @ApiProperty({
        description: 'Last name of the customer',
        type: String,
        example: 'Kowalski',
    })
    @Expose()
    lastName: string;

    @ApiProperty({
        description: 'Contact phone number',
        type: String,
        nullable: true,
        example: '+48123123123',
    })
    @Expose()
    phone: string | null;

    @ApiProperty({
        description: 'Role assigned to the customer',
        enum: Role,
        example: Role.Client,
    })
    @Expose()
    role: Role;

    @ApiProperty({
        description: 'Whether the customer accepted the privacy policy',
        type: Boolean,
        example: true,
    })
    @Expose()
    privacyConsent: boolean;

    @ApiProperty({
        description: 'Whether the customer consents to marketing messages',
        type: Boolean,
        example: false,
    })
    @Expose()
    marketingConsent: boolean;

    @ApiProperty({
        description: 'Timestamp when the customer was created',
        type: String,
        example: '2024-01-01T00:00:00.000Z',
    })
    @Expose()
    createdAt: Date;

    @ApiProperty({
        description: 'Timestamp of the last update',
        type: String,
        example: '2024-01-02T00:00:00.000Z',
    })
    @Expose()
    updatedAt: Date;

    @ApiProperty({
        description: 'Indicates if the customer account is active',
        type: Boolean,
        example: true,
    })
    @Expose()
    isActive: boolean;
}
