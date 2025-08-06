import { ApiErrorResponses } from '../common/decorators/api-error-responses.decorator';
import {
    Body,
    Controller,
    Get,
    Post,
    Request,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiTags,
    ApiOkResponse,
    ApiCreatedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../users/role.enum';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { Message } from './message.entity';

@ApiTags('Messages')
@ApiBearerAuth()
@Controller('messages')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Client, Role.Employee)
export class MessagesController {
    constructor(private readonly service: MessagesService) {}

    @Get()
    @ApiOperation({ summary: 'List messages for user' })
    @ApiOkResponse({
        description: 'Messages for the authenticated user',
        type: Message,
        isArray: true,
    })
    @ApiErrorResponses()
    list(@Request() req): Promise<Message[]> {
        return this.service.findForUser(Number(req.user.id));
    }

    @Post()
    @ApiOperation({ summary: 'Create message' })
    @ApiCreatedResponse({
        description: 'Message successfully created',
        type: Message,
    })
    @ApiErrorResponses()
    create(
        @Request() req,
        @Body() dto: CreateMessageDto,
    ): Promise<Message> {
        return this.service.create(
            Number(req.user.id),
            dto.recipientId,
            dto.content,
        );
    }
}
