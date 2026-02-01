import { ApiProperty } from '@nestjs/swagger';
import {
    IsString,
    IsNumber,
    IsBoolean,
    IsOptional,
    IsNotEmpty,
    IsDateString,
    IsArray,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RefreshTokenDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @ApiProperty({
        description: 'JWT refresh token (optional when sent via cookie)',
        example: 'eyJhbGci...',
        required: false,
    })
    refreshToken?: string;
}
