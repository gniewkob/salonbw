import { Transform } from 'class-transformer';
import { IsEmail, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
    @Transform(({ value }: { value: unknown }) =>
        typeof value === 'string' ? value.trim().toLowerCase() : value,
    )
    @IsEmail()
    @MaxLength(254)
    @ApiProperty({ example: 'klientka@example.com' })
    email: string;
}
