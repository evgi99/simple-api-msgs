"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagesService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const message_schema_1 = require("./schemas/message.schema");
let MessagesService = class MessagesService {
    constructor(messageModel) {
        this.messageModel = messageModel;
    }
    async create(senderId, receiverId, subject, body) {
        const msg = new this.messageModel({
            senderId: new mongoose_2.Types.ObjectId(senderId),
            receiverId: new mongoose_2.Types.ObjectId(receiverId),
            subject,
            body,
        });
        return msg.save();
    }
    async findAllForUser(userId) {
        const uid = new mongoose_2.Types.ObjectId(userId);
        return this.messageModel
            .find({
            receiverId: uid,
            deletedBy: { $ne: uid },
        })
            .sort({ createdAt: -1 })
            .lean()
            .exec();
    }
    async findUnreadForUser(userId) {
        const uid = new mongoose_2.Types.ObjectId(userId);
        return this.messageModel
            .find({
            receiverId: uid,
            readAt: null,
            deletedBy: { $ne: uid },
        })
            .sort({ createdAt: -1 })
            .lean()
            .exec();
    }
    async findOne(messageId, user) {
        if (!mongoose_2.Types.ObjectId.isValid(messageId)) {
            throw new common_1.NotFoundException('Message not found');
        }
        const msg = await this.messageModel.findById(messageId).exec();
        if (!msg)
            throw new common_1.NotFoundException('Message not found');
        const uid = new mongoose_2.Types.ObjectId(user.id);
        const isSender = msg.senderId.equals(uid);
        const isReceiver = msg.receiverId.equals(uid);
        if (!isSender && !isReceiver) {
            throw new common_1.ForbiddenException('You do not have access to this message');
        }
        if (msg.deletedBy.some((id) => id.equals(uid))) {
            throw new common_1.NotFoundException('Message not found');
        }
        if (isReceiver && !msg.readAt) {
            msg.readAt = new Date();
            await msg.save();
        }
        return msg;
    }
    async remove(messageId, user) {
        if (!mongoose_2.Types.ObjectId.isValid(messageId)) {
            throw new common_1.NotFoundException('Message not found');
        }
        const msg = await this.messageModel.findById(messageId).exec();
        if (!msg)
            throw new common_1.NotFoundException('Message not found');
        const uid = new mongoose_2.Types.ObjectId(user.id);
        const isSender = msg.senderId.equals(uid);
        const isReceiver = msg.receiverId.equals(uid);
        if (!isSender && !isReceiver) {
            throw new common_1.ForbiddenException('You cannot delete this message');
        }
        if (!msg.deletedBy.some((id) => id.equals(uid))) {
            msg.deletedBy.push(uid);
            await msg.save();
        }
    }
};
exports.MessagesService = MessagesService;
exports.MessagesService = MessagesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(message_schema_1.Message.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], MessagesService);
//# sourceMappingURL=messages.service.js.map