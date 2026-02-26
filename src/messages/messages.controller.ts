import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from '../common/dto/create-message.dto';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Public()
  @Get('admin/test')
  getSmokeTest(): { status: string } {
    return { status: 'ok' };
  }

  @Post()
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateMessageDto,
  ) {
    return this.messagesService.create(
      user.id,
      dto.receiverId,
      dto.subject,
      dto.body,
    );
  }

  @Get()
  async findAll(@CurrentUser() user: CurrentUserPayload) {
    return this.messagesService.findAllForUser(user.id);
  }

  @Get('unread')
  async findUnread(@CurrentUser() user: CurrentUserPayload) {
    return this.messagesService.findUnreadForUser(user.id);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.messagesService.findOne(id, user);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    await this.messagesService.remove(id, user);
    return { deleted: true };
  }
}
