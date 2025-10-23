import {
    IsEmail,
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
    IsObject,
} from 'class-validator';

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
    @IsObject()
    data?: Record<string, string>;
}
