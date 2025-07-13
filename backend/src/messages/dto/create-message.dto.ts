import { IsInt, IsString } from 'class-validator';

export class CreateMessageDto {
    @IsInt()
    recipientId: number;

    @IsString()
    content: string;
}
