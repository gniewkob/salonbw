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
    @IsString()
    @IsNotEmpty()
    @ApiProperty({ description: 'JWT refresh token', example: 'eyJhbGci...' })
    refreshToken: string;
}
