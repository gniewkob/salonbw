import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { NoteType } from '../entities/customer-note.entity';

export class CreateCustomerNoteDto {
    @ApiProperty()
    @IsString()
    content: string;

    @ApiPropertyOptional({ enum: NoteType })
    @IsOptional()
    @IsEnum(NoteType)
    type?: NoteType;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isPinned?: boolean;
}

export class UpdateCustomerNoteDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    content?: string;

    @ApiPropertyOptional({ enum: NoteType })
    @IsOptional()
    @IsEnum(NoteType)
    type?: NoteType;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isPinned?: boolean;
}
