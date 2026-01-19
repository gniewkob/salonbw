import { ApiProperty } from '@nestjs/swagger';
import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsObject,
} from 'class-validator';

export class SendEmailDto {
    @ApiProperty({ description: 'Recipient email address' })
    @IsString()
    @IsNotEmpty()
    to: string;

    @ApiProperty({ description: 'Email subject' })
    @IsString()
    @IsNotEmpty()
    subject: string;

    @ApiProperty({ description: 'Email template content with {{placeholders}}' })
    @IsString()
    @IsNotEmpty()
    template: string;

    @ApiProperty({ description: 'Data for template placeholders', required: false })
    @IsOptional()
    @IsObject()
    data?: Record<string, string>;
}
