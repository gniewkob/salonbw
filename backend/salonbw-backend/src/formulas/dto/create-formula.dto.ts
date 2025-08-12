import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsISO8601 } from 'class-validator';

export class CreateFormulaDto {
    @ApiProperty()
    @IsString()
    description: string;

    @ApiProperty()
    @IsISO8601()
    date: string;
}
