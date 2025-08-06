import { IsInt, IsOptional, IsString, Max, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReviewDto {
    @ApiProperty({
        description: 'Identifier of the reviewed appointment',
        type: Number,
        example: 1,
    })
    @IsInt()
    appointmentId: number;

    @ApiProperty({
        description: 'Rating from 1 (worst) to 5 (best)',
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
        maxLength: 500,
        example: 'Excellent service',
    })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    comment?: string;
}
