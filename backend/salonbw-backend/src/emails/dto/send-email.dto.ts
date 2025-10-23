import {
    IsEmail,
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class EmailDataDto {
    [key: string]: string;
}

export class SendEmailDto {
    @IsEmail()
    to!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    subject!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(5000)
    template!: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => EmailDataDto)
    data: Record<string, string> = {};
}

