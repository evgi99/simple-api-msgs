import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument } from './schemas/message.schema';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name) private readonly messageModel: Model<MessageDocument>,
  ) {}

  async create(
    senderId: string,
    receiverId: string,
    subject: string,
    body: string,
  ): Promise<MessageDocument> {
    const msg = new this.messageModel({
      senderId: new Types.ObjectId(senderId),
      receiverId: new Types.ObjectId(receiverId),
      subject,
      body,
    });
    return msg.save();
  }

  /** All messages for current user as receiver (inbox), excluding those deleted by them. */
  async findAllForUser(userId: string): Promise<MessageDocument[]> {
    const uid = new Types.ObjectId(userId);
    return this.messageModel
      .find({
        receiverId: uid,
        deletedBy: { $ne: uid },
      })
      .sort({ createdAt: -1 })
      .lean()
      .exec() as Promise<MessageDocument[]>;
  }

  /** Unread messages for current user (as receiver), not deleted by them. */
  async findUnreadForUser(userId: string): Promise<MessageDocument[]> {
    const uid = new Types.ObjectId(userId);
    return this.messageModel
      .find({
        receiverId: uid,
        readAt: null,
        deletedBy: { $ne: uid },
      })
      .sort({ createdAt: -1 })
      .lean()
      .exec() as Promise<MessageDocument[]>;
  }

  /** Get one message by id; only if user is sender or receiver. Mark as read when receiver reads. */
  async findOne(
    messageId: string,
    user: CurrentUserPayload,
  ): Promise<MessageDocument> {
    if (!Types.ObjectId.isValid(messageId)) {
      throw new NotFoundException('Message not found');
    }
    const msg = await this.messageModel.findById(messageId).exec();
    if (!msg) throw new NotFoundException('Message not found');
    const uid = new Types.ObjectId(user.id);
    const isSender = msg.senderId.equals(uid);
    const isReceiver = msg.receiverId.equals(uid);
    if (!isSender && !isReceiver) {
      throw new ForbiddenException('You do not have access to this message');
    }
    if (msg.deletedBy.some((id) => id.equals(uid))) {
      throw new NotFoundException('Message not found');
    }
    if (isReceiver && !msg.readAt) {
      msg.readAt = new Date();
      await msg.save();
    }
    return msg;
  }

  /** Soft-delete for current user (as sender or receiver). */
  async remove(messageId: string, user: CurrentUserPayload): Promise<void> {
    if (!Types.ObjectId.isValid(messageId)) {
      throw new NotFoundException('Message not found');
    }
    const msg = await this.messageModel.findById(messageId).exec();
    if (!msg) throw new NotFoundException('Message not found');
    const uid = new Types.ObjectId(user.id);
    const isSender = msg.senderId.equals(uid);
    const isReceiver = msg.receiverId.equals(uid);
    if (!isSender && !isReceiver) {
      throw new ForbiddenException('You cannot delete this message');
    }
    if (!msg.deletedBy.some((id) => id.equals(uid))) {
      msg.deletedBy.push(uid);
      await msg.save();
    }
  }
}
