import { IsInt, IsOptional, IsString, Max, Min, MaxLength } from 'class-validator';

export class CreateAppointmentReviewDto {
    @IsInt()
    @Min(1)
    @Max(5)
    rating: number;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    comment?: string;
}
