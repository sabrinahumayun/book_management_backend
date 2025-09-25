import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { UserRole } from './entities/user.entity';
import { RegisterDto, LoginDto, AuthResponseDto } from './dto/auth.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      // Arrange
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const expectedResponse: AuthResponseDto = {
        access_token: 'jwt_token',
        message: 'User created successfully',
        user: {
          id: 1,
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: UserRole.USER,
        },
      };

      mockAuthService.register.mockResolvedValue(expectedResponse);

      // Act
      const result = await controller.register(registerDto);

      // Assert
      expect(result).toEqual(expectedResponse);
      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      // Arrange
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const expectedResponse: AuthResponseDto = {
        access_token: 'jwt_token',
        message: 'Login successful',
        user: {
          id: 1,
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: UserRole.USER,
        },
      };

      mockAuthService.login.mockResolvedValue(expectedResponse);

      // Act
      const result = await controller.login(loginDto);

      // Assert
      expect(result).toEqual(expectedResponse);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('getProfile', () => {
    it('should return user profile', () => {
      // Arrange
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.USER,
      };

      const mockRequest = {
        user: mockUser,
      };

      // Act
      const result = controller.getProfile(mockRequest);

      // Assert
      expect(result).toEqual(mockUser);
    });
  });

  describe('adminOnly', () => {
    it('should return admin-only message', () => {
      // Arrange
      const mockUser = {
        id: 1,
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
      };

      const mockRequest = {
        user: mockUser,
      };

      // Act
      const result = controller.adminOnly(mockRequest);

      // Assert
      expect(result).toEqual({
        message: 'This is an admin-only endpoint',
        user: mockUser,
      });
    });
  });

  describe('userOrAdmin', () => {
    it('should return user-or-admin message for user', () => {
      // Arrange
      const mockUser = {
        id: 1,
        email: 'user@example.com',
        firstName: 'Regular',
        lastName: 'User',
        role: UserRole.USER,
      };

      const mockRequest = {
        user: mockUser,
      };

      // Act
      const result = controller.userOrAdmin(mockRequest);

      // Assert
      expect(result).toEqual({
        message: 'This endpoint is accessible to both users and admins',
        user: mockUser,
      });
    });

    it('should return user-or-admin message for admin', () => {
      // Arrange
      const mockUser = {
        id: 1,
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
      };

      const mockRequest = {
        user: mockUser,
      };

      // Act
      const result = controller.userOrAdmin(mockRequest);

      // Assert
      expect(result).toEqual({
        message: 'This endpoint is accessible to both users and admins',
        user: mockUser,
      });
    });
  });
});
