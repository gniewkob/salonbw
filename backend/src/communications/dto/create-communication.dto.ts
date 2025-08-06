import { IsInt, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommunicationDto {
    @ApiProperty({
        description: 'Identifier of the customer receiving the communication',
        type: Number,
        example: 1,
    })
    @IsInt()
    customerId: number;

    @ApiProperty({
        description: 'Medium used for the communication',
        type: String,
        example: 'email',
    })
    @IsString()
    medium: string;

    @ApiProperty({
        description: 'Content of the communication message',
        type: String,
        example: 'Thank you for your visit!'
    })
    @IsString()
    content: string;
}
