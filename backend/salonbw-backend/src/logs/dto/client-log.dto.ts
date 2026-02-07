import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty, IsObject } from 'class-validator';

export class ClientLogDto {
    @ApiProperty({ description: 'The error message' })
    @IsString()
    @IsNotEmpty()
    message: string;

    @ApiPropertyOptional({ description: 'The log level', example: 'error' })
    @IsString()
    @IsOptional()
    level?: string;

    @ApiPropertyOptional({ description: 'The path where the error occurred' })
    @IsString()
    @IsOptional()
    path?: string;

    @ApiPropertyOptional({ description: 'The user agent of the client' })
    @IsString()
    @IsOptional()
    userAgent?: string;

    @ApiPropertyOptional({ description: 'The stack trace of the error' })
    @IsString()
    @IsOptional()
    stack?: string;

    @ApiPropertyOptional({ description: 'Additional context or data' })
    @IsObject()
    @IsOptional()
    extra?: Record<string, any>;
}
