import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { User } from '../users/schemas/user.schema';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUserModel = {};
  const mockUsersService = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
  };
  const mockJwtService = {
    sign: jest.fn().mockReturnValue('fake-jwt-token'),
    verifyAsync: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: getModelToken(User.name), useValue: mockUserModel },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
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
      } as any;
      mockUsersService.create.mockResolvedValue(created);

      const result = await service.register('a@b.com', 'password123');

      expect(mockUsersService.create).toHaveBeenCalledWith(
        'a@b.com',
        expect.any(String),
      );
      expect(result.access_token).toBe('fake-jwt-token');
      expect(result.refresh_token).toBe('fake-jwt-token');
      expect(result.user).toEqual({ id: '507f1f77bcf86cd799439011', email: 'a@b.com' });
    });

    it('should throw ConflictException when user already exists', async () => {
      mockUsersService.create.mockRejectedValue(
        new ConflictException('User with this email already exists'),
      );

      await expect(service.register('existing@b.com', 'password123')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    it('should return token when password matches', async () => {
      const user = {
        _id: '507f1f77bcf86cd799439011',
        email: 'a@b.com',
        passwordHash: 'hashed',
      } as any;
      mockUsersService.findByEmail.mockResolvedValue(user);
      const bcrypt = require('bcrypt');
      const spy = jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      const result = await service.login('a@b.com', 'password123');

      expect(result.access_token).toBe('fake-jwt-token');
      expect(result.refresh_token).toBe('fake-jwt-token');
      expect(result.user.email).toBe('a@b.com');
      spy.mockRestore();
    });

    it('should throw when user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(service.login('a@b.com', 'password')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw when password does not match', async () => {
      const user = {
        _id: '507f1f77bcf86cd799439011',
        email: 'a@b.com',
        passwordHash: 'hashed',
      } as any;
      mockUsersService.findByEmail.mockResolvedValue(user);
      const bcrypt = require('bcrypt');
      const spy = jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      await expect(service.login('a@b.com', 'wrongpassword')).rejects.toThrow(
        UnauthorizedException,
      );

      spy.mockRestore();
    });
  });

  describe('refresh', () => {
    it('should return new access and refresh tokens when refresh token is valid', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({
        sub: '507f1f77bcf86cd799439011',
        email: 'a@b.com',
        type: 'refresh',
      });
      mockUsersService.findById.mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        email: 'a@b.com',
      } as any);

      const result = await service.refresh('valid-refresh-token');

      expect(result.access_token).toBe('fake-jwt-token');
      expect(result.refresh_token).toBe('fake-jwt-token');
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('valid-refresh-token');
    });

    it('should throw when refresh token is invalid or expired', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error('invalid token'));

      await expect(service.refresh('invalid-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw when user no longer exists', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({
        sub: '507f1f77bcf86cd799439011',
        email: 'a@b.com',
        type: 'refresh',
      });
      mockUsersService.findById.mockResolvedValue(null);

      await expect(service.refresh('valid-refresh-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw when token type is not refresh', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({
        sub: '507f1f77bcf86cd799439011',
        email: 'a@b.com',
        type: 'access',
      });

      await expect(service.refresh('access-token-used-as-refresh')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('validateUser', () => {
    it('should return user when found', async () => {
      const user = { _id: '507f1f77bcf86cd799439011', email: 'a@b.com' } as any;
      mockUsersService.findById.mockResolvedValue(user);

      const result = await service.validateUser({
        sub: '507f1f77bcf86cd799439011',
        email: 'a@b.com',
        type: 'access',
      });

      expect(result).toEqual({ id: '507f1f77bcf86cd799439011', email: 'a@b.com' });
    });

    it('should return null when user not found', async () => {
      mockUsersService.findById.mockResolvedValue(null);

      const result = await service.validateUser({
        sub: '507f1f77bcf86cd799439011',
        email: 'a@b.com',
        type: 'access',
      });

      expect(result).toBeNull();
    });
  });
});
