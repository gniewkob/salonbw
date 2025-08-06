import { IsInt, IsOptional, IsString, Max, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAppointmentReviewDto {
    @ApiProperty({
        description: 'Rating given to the appointment from 1 (worst) to 5 (best)',
        type: Number,
        minimum: 1,
        maximum: 5,
        example: 5,
    })
    @IsInt()
    @Min(1)
    @Max(5)
    rating: number;

    @ApiPropertyOptional({
        description: 'Optional review comment',
        type: String,
        example: 'Great service and friendly staff',
        maxLength: 500,
    })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    comment?: string;
}
