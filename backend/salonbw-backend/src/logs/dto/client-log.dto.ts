import {
    IsIn,
    IsObject,
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';

const LEVELS = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'] as const;
export type ClientLogLevel = (typeof LEVELS)[number];

export class ClientLogDto {
    @IsString()
    @MaxLength(500)
    message!: string;

    @IsOptional()
    @IsString()
    @MaxLength(2000)
    stack?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    path?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    userAgent?: string;

    @IsOptional()
    @IsIn(LEVELS)
    level?: ClientLogLevel;

    @IsOptional()
    @IsObject()
    extra?: Record<string, unknown>;
}
