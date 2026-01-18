import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDateString } from 'class-validator';

export class CreateFormulaDto {
    @ApiProperty()
    @IsString()
    description: string;

    @ApiProperty()
    @IsDateString()
    date: string;
}
