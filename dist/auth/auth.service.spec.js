"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const mongoose_1 = require("@nestjs/mongoose");
const auth_service_1 = require("./auth.service");
const users_service_1 = require("../users/users.service");
const user_schema_1 = require("../users/schemas/user.schema");
describe('AuthService', () => {
    let service;
    let usersService;
    let jwtService;
    const mockUserModel = {};
    const mockUsersService = {
        findByEmail: jest.fn(),
        findById: jest.fn(),
        create: jest.fn(),
    };
    const mockJwtService = {
        sign: jest.fn().mockReturnValue('fake-jwt-token'),
    };
    beforeEach(async () => {
        jest.clearAllMocks();
        const module = await testing_1.Test.createTestingModule({
            providers: [
                auth_service_1.AuthService,
                { provide: users_service_1.UsersService, useValue: mockUsersService },
                { provide: jwt_1.JwtService, useValue: mockJwtService },
                { provide: (0, mongoose_1.getModelToken)(user_schema_1.User.name), useValue: mockUserModel },
            ],
        }).compile();
        service = module.get(auth_service_1.AuthService);
        usersService = module.get(users_service_1.UsersService);
        jwtService = module.get(jwt_1.JwtService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('register', () => {
        it('should create user and return token and user', async () => {
            const created = {
                _id: '507f1f77bcf86cd799439011',
                email: 'a@b.com',
                passwordHash: 'hashed',
            };
            mockUsersService.create.mockResolvedValue(created);
            const result = await service.register('a@b.com', 'password123');
            expect(mockUsersService.create).toHaveBeenCalledWith('a@b.com', expect.any(String));
            expect(result.access_token).toBe('fake-jwt-token');
            expect(result.user).toEqual({ id: '507f1f77bcf86cd799439011', email: 'a@b.com' });
        });
        it('should throw ConflictException when user already exists', async () => {
            mockUsersService.create.mockRejectedValue(new common_1.ConflictException('User with this email already exists'));
            await expect(service.register('existing@b.com', 'password123')).rejects.toThrow(common_1.ConflictException);
        });
    });
    describe('login', () => {
        it('should return token when password matches', async () => {
            const user = {
                _id: '507f1f77bcf86cd799439011',
                email: 'a@b.com',
                passwordHash: 'hashed',
            };
            mockUsersService.findByEmail.mockResolvedValue(user);
            const bcrypt = require('bcrypt');
            const spy = jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
            const result = await service.login('a@b.com', 'password123');
            expect(result.access_token).toBe('fake-jwt-token');
            expect(result.user.email).toBe('a@b.com');
            spy.mockRestore();
        });
        it('should throw when user not found', async () => {
            mockUsersService.findByEmail.mockResolvedValue(null);
            await expect(service.login('a@b.com', 'password')).rejects.toThrow(common_1.UnauthorizedException);
        });
        it('should throw when password does not match', async () => {
            const user = {
                _id: '507f1f77bcf86cd799439011',
                email: 'a@b.com',
                passwordHash: 'hashed',
            };
            mockUsersService.findByEmail.mockResolvedValue(user);
            const bcrypt = require('bcrypt');
            const spy = jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);
            await expect(service.login('a@b.com', 'wrongpassword')).rejects.toThrow(common_1.UnauthorizedException);
            spy.mockRestore();
        });
    });
    describe('validateUser', () => {
        it('should return user when found', async () => {
            const user = { _id: '507f1f77bcf86cd799439011', email: 'a@b.com' };
            mockUsersService.findById.mockResolvedValue(user);
            const result = await service.validateUser({
                sub: '507f1f77bcf86cd799439011',
                email: 'a@b.com',
            });
            expect(result).toEqual({ id: '507f1f77bcf86cd799439011', email: 'a@b.com' });
        });
        it('should return null when user not found', async () => {
            mockUsersService.findById.mockResolvedValue(null);
            const result = await service.validateUser({
                sub: '507f1f77bcf86cd799439011',
                email: 'a@b.com',
            });
            expect(result).toBeNull();
        });
    });
});
//# sourceMappingURL=auth.service.spec.js.map