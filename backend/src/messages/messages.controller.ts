import {
    Body,
    Controller,
    Get,
    Post,
    Request,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../users/role.enum';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';

@ApiTags('Messages')
@ApiBearerAuth()
@Controller('messages')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Client, Role.Employee)
export class MessagesController {
    constructor(private readonly service: MessagesService) {}

    @Get()
    @ApiOperation({ summary: 'List messages for user' })
    @ApiResponse({ status: 200 })
    list(@Request() req) {
        return this.service.findForUser(Number(req.user.id));
    }

    @Post()
    @ApiOperation({ summary: 'Create message' })
    @ApiResponse({ status: 201 })
    create(@Request() req, @Body() dto: CreateMessageDto) {
        return this.service.create(
            Number(req.user.id),
            dto.recipientId,
            dto.content,
        );
    }
}
