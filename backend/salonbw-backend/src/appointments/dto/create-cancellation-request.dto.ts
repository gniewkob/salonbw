import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCancellationRequestDto {
    @IsOptional()
    @IsString()
    @MaxLength(500)
    reason?: string;
}
