import { IsInt, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFormulaDto {
    @ApiProperty({
        description: 'Identifier of the client for whom the formula is created',
        type: Number,
        example: 1,
    })
    @IsInt()
    clientId: number;

    @ApiProperty({
        description: 'Description of the formula',
        type: String,
        example: 'Custom hair color mix',
    })
    @IsString()
    description: string;

    @ApiPropertyOptional({
        description: 'Associated appointment identifier',
        type: Number,
        example: 10,
    })
    @IsOptional()
    @IsInt()
    appointmentId?: number;
}
