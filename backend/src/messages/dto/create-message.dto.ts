import { IsInt, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMessageDto {
    @ApiProperty({
        description: 'Identifier of the message recipient',
        type: Number,
        example: 1,
    })
    @IsInt()
    recipientId: number;

    @ApiProperty({
        description: 'Message content',
        type: String,
        example: 'Your order is ready for pickup.',
    })
    @IsString()
    content: string;
}
