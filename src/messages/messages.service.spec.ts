import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MessagesService } from './messages.service';
import { Message, MessageDocument } from './schemas/message.schema';

describe('MessagesService', () => {
  let service: MessagesService;
  let model: Model<MessageDocument>;

  const senderId = new Types.ObjectId();
  const receiverId = new Types.ObjectId();
  const otherId = new Types.ObjectId();

  const mockSave = jest.fn();
  const mockExec = jest.fn();
  const mockModel = function (this: { save: ReturnType<typeof jest.fn> }) {
    this.save = mockSave;
  } as unknown as Model<MessageDocument> & {
    find: jest.Mock;
    sort: jest.Mock;
    lean: jest.Mock;
    exec: jest.Mock;
    findById: jest.Mock;
  };
  mockModel.find = jest.fn().mockReturnThis();
  mockModel.sort = jest.fn().mockReturnThis();
  mockModel.lean = jest.fn().mockReturnThis();
  mockModel.exec = mockExec;
  mockModel.findById = jest.fn().mockReturnValue({ exec: jest.fn() });

  beforeEach(async () => {
    jest.clearAllMocks();
    mockModel.findById.mockReturnValue({ exec: jest.fn() });
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        {
          provide: getModelToken(Message.name),
          useValue: mockModel,
        },
      ],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
    model = module.get<Model<MessageDocument>>(getModelToken(Message.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should save and return the created message', async () => {
      const savedDoc = {
        _id: new Types.ObjectId(),
        senderId,
        receiverId,
        subject: 'Hi',
        body: 'Body',
        createdAt: new Date(),
        readAt: null,
        deletedBy: [],
      };
      mockSave.mockResolvedValueOnce(savedDoc);

      const result = await service.create(
        senderId.toString(),
        receiverId.toString(),
        'Hi',
        'Body',
      );

      expect(mockSave).toHaveBeenCalled();
      expect(result).toEqual(savedDoc);
    });
  });

  describe('findAllForUser', () => {
    it('should return messages where user is receiver, excluding deleted by them', async () => {
      const expected = [
        { _id: new Types.ObjectId(), subject: 'A', senderId, receiverId },
      ];
      mockExec.mockResolvedValueOnce(expected);

      const result = await service.findAllForUser(receiverId.toString());

      expect(result).toEqual(expected);
      expect(mockModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          receiverId: expect.anything(),
          deletedBy: { $ne: expect.anything() },
        }),
      );
    });
  });

  describe('findUnreadForUser', () => {
    it('should return unread messages for user as receiver', async () => {
      const expected = [
        { _id: new Types.ObjectId(), subject: 'Unread', readAt: null },
      ];
      mockExec.mockResolvedValueOnce(expected);

      const result = await service.findUnreadForUser(receiverId.toString());

      expect(result).toEqual(expected);
      expect(mockModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          readAt: null,
          deletedBy: { $ne: expect.anything() },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should throw NotFound when message id is invalid ObjectId', async () => {
      await expect(
        service.findOne('not-a-valid-id', {
          id: senderId.toString(),
          email: 's@x.com',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFound when message does not exist', async () => {
      mockModel.findById.mockReturnValue({
        exec: () => Promise.resolve(null),
      });

      await expect(
        service.findOne('507f1f77bcf86cd799439011', {
          id: senderId.toString(),
          email: 's@x.com',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw Forbidden when user is not sender or receiver', async () => {
      const msg = {
        _id: new Types.ObjectId(),
        senderId,
        receiverId,
        subject: 'Hi',
        body: 'Hello',
        createdAt: new Date(),
        readAt: null,
        deletedBy: [],
        save: jest.fn().mockResolvedValue(undefined),
      };
      mockModel.findById.mockReturnValue({
        exec: () => Promise.resolve(msg),
      });

      await expect(
        service.findOne('507f1f77bcf86cd799439011', {
          id: otherId.toString(),
          email: 'other@x.com',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should mark as read when receiver reads and return message', async () => {
      const readAt = new Date();
      const msg = {
        _id: new Types.ObjectId(),
        senderId,
        receiverId,
        subject: 'Hi',
        body: 'Hello',
        createdAt: new Date(),
        readAt: null,
        deletedBy: [],
        save: jest.fn().mockImplementation(function (this: { readAt: Date | null }) {
          this.readAt = readAt;
          return Promise.resolve(this);
        }),
      };
      mockModel.findById.mockReturnValue({
        exec: () => Promise.resolve(msg),
      });

      const result = await service.findOne(msg._id.toString(), {
        id: receiverId.toString(),
        email: 'r@x.com',
      });

      expect(msg.save).toHaveBeenCalled();
      expect(result.readAt).toEqual(readAt);
    });
  });

  describe('remove', () => {
    it('should add user to deletedBy and save when user is sender', async () => {
      const msg = {
        _id: new Types.ObjectId(),
        senderId,
        receiverId,
        deletedBy: [] as Types.ObjectId[],
        save: jest.fn().mockResolvedValue(undefined),
      };
      mockModel.findById.mockReturnValue({
        exec: () => Promise.resolve(msg),
      });

      await service.remove(msg._id.toString(), {
        id: senderId.toString(),
        email: 's@x.com',
      });

      expect(msg.deletedBy).toContainEqual(senderId);
      expect(msg.save).toHaveBeenCalled();
    });

    it('should not double-add when user already in deletedBy', async () => {
      const msg = {
        _id: new Types.ObjectId(),
        senderId,
        receiverId,
        deletedBy: [senderId] as Types.ObjectId[],
        save: jest.fn().mockResolvedValue(undefined),
      };
      mockModel.findById.mockReturnValue({
        exec: () => Promise.resolve(msg),
      });

      await service.remove(msg._id.toString(), {
        id: senderId.toString(),
        email: 's@x.com',
      });

      expect(msg.save).not.toHaveBeenCalled();
    });

    it('should throw NotFound when message id is invalid ObjectId', async () => {
      await expect(
        service.remove('not-a-valid-id', {
          id: senderId.toString(),
          email: 's@x.com',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
