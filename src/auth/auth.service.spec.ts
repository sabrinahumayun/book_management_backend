import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { AuthService } from './auth.service';
import { User, UserRole } from './entities/user.entity';
import { RegisterDto, LoginDto } from './dto/auth.dto';

// Mock bcrypt
jest.mock('bcryptjs');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let jwtService: JwtService;

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('should register a new user successfully', async () => {
      // Arrange
      const hashedPassword = 'hashed_password';
      const savedUser = {
        id: 1,
        email: registerDto.email,
        password: hashedPassword,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        role: UserRole.USER,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);
      mockUserRepository.create.mockReturnValue(savedUser as any);
      mockUserRepository.save.mockResolvedValue(savedUser as any);
      mockJwtService.sign.mockReturnValue('jwt_token');

      // Act
      const result = await service.register(registerDto);

      // Assert
      expect(result).toEqual({
        access_token: 'jwt_token',
        message: 'User created successfully',
        user: {
          id: 1,
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: UserRole.USER,
        },
      });

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(registerDto.password, 12);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        email: registerDto.email,
        password: hashedPassword,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        role: UserRole.USER,
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        email: savedUser.email,
        sub: savedUser.id,
        role: savedUser.role,
      });
    });

    it('should throw ConflictException if user already exists', async () => {
      // Arrange
      const existingUser = { id: 1, email: registerDto.email } as User;
      mockUserRepository.findOne.mockResolvedValue(existingUser);

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
    });

    it('should register user with admin role when specified', async () => {
      // Arrange
      const adminRegisterDto = { ...registerDto, role: UserRole.ADMIN };
      const hashedPassword = 'hashed_password';
      const savedUser = {
        id: 1,
        ...adminRegisterDto,
        password: hashedPassword,
        role: UserRole.ADMIN,
      } as User;

      mockUserRepository.findOne.mockResolvedValue(null);
      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);
      mockUserRepository.create.mockReturnValue(savedUser);
      mockUserRepository.save.mockResolvedValue(savedUser);
      mockJwtService.sign.mockReturnValue('jwt_token');

      // Act
      const result = await service.register(adminRegisterDto);

      // Assert
      expect(result.user.role).toBe(UserRole.ADMIN);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        email: adminRegisterDto.email,
        password: hashedPassword,
        firstName: adminRegisterDto.firstName,
        lastName: adminRegisterDto.lastName,
        role: UserRole.ADMIN,
      });
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login user successfully', async () => {
      // Arrange
      const user = {
        id: 1,
        email: loginDto.email,
        password: 'hashed_password',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.USER,
      } as User;

      mockUserRepository.findOne.mockResolvedValue(user);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      mockJwtService.sign.mockReturnValue('jwt_token');

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(result).toEqual({
        access_token: 'jwt_token',
        message: 'Login successful',
        user: {
          id: 1,
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: UserRole.USER,
        },
      });

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: loginDto.email },
      });
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        user.password,
      );
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      // Arrange
      const user = {
        id: 1,
        email: loginDto.email,
        password: 'hashed_password',
      } as User;

      mockUserRepository.findOne.mockResolvedValue(user);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('validateUser', () => {
    it('should return user for valid credentials', async () => {
      // Arrange
      const user = {
        id: 1,
        email: 'test@example.com',
        password: 'hashed_password',
      } as User;

      mockUserRepository.findOne.mockResolvedValue(user);
      mockedBcrypt.compare.mockResolvedValue(true as never);

      // Act
      const result = await service.validateUser('test@example.com', 'password123');

      // Assert
      expect(result).toEqual(user);
    });

    it('should return null for invalid credentials', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await service.validateUser('test@example.com', 'wrongpassword');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('validateUserById', () => {
    it('should return user for valid ID', async () => {
      // Arrange
      const user = { id: 1, email: 'test@example.com' } as User;
      mockUserRepository.findOne.mockResolvedValue(user);

      // Act
      const result = await service.validateUserById(1);

      // Assert
      expect(result).toEqual(user);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should return null for invalid ID', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await service.validateUserById(999);

      // Assert
      expect(result).toBeNull();
    });
  });
});
