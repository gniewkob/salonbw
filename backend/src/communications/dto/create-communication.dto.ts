import { IsInt, IsString } from 'class-validator';

export class CreateCommunicationDto {
    @IsInt()
    customerId: number;

    @IsString()
    medium: string;

    @IsString()
    content: string;
}
