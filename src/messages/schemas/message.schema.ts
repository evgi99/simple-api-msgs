import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema({ timestamps: true, collection: 'messages' })
export class Message {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  senderId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  receiverId!: Types.ObjectId;

  @Prop({ required: true })
  subject!: string;

  @Prop({ required: true })
  body!: string;

  @Prop({ default: Date.now })
  createdAt!: Date;

  @Prop({ type: Date, default: null })
  readAt!: Date | null;

  /** User IDs who have soft-deleted this message (sender or receiver). */
  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  deletedBy!: Types.ObjectId[];
}

export const MessageSchema = SchemaFactory.createForClass(Message);

MessageSchema.index({ receiverId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1, createdAt: -1 });
MessageSchema.index({ receiverId: 1, readAt: 1 });
MessageSchema.index({ _id: 1, deletedBy: 1 });
