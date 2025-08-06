import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAppointmentFormulaDto {
    @ApiProperty({
        description: 'Description of the formula used during the appointment',
        type: String,
        example: '2 parts developer to 1 part color',
    })
    @IsString()
    description: string;
}
