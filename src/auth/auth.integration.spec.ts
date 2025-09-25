import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Repository } from 'typeorm';
import * as request from 'supertest';

import { AuthModule } from './auth.module';
import { AuthService } from './auth.service';
import { User, UserRole } from './entities/user.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { RolesGuard } from './guards/roles.guard';

describe('Auth Integration Tests', () => {
  let app: INestApplication;
  let authService: AuthService;
  let userRepository: Repository<User>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432'),
          username: process.env.DB_USERNAME || 'postgres',
          password: process.env.DB_PASSWORD || 'postgres',
          database: process.env.DB_DATABASE || 'book_management_test',
          entities: [User],
          synchronize: true,
          logging: false,
        }),
        AuthModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Enable validation pipes
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));
    
    authService = moduleFixture.get<AuthService>(AuthService);
    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up database before each test
    try {
      await userRepository.clear();
    } catch (error) {
      // Fallback: delete all users
      const users = await userRepository.find();
      if (users.length > 0) {
        await userRepository.remove(users);
      }
    }
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(registerDto)
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('message', 'User created successfully');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(registerDto.email);
      expect(response.body.user.firstName).toBe(registerDto.firstName);
      expect(response.body.user.lastName).toBe(registerDto.lastName);
      expect(response.body.user.role).toBe(UserRole.USER);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should register user with admin role when specified', async () => {
      const registerDto = {
        email: 'admin@example.com',
        password: 'password123',
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(registerDto)
        .expect(201);

      expect(response.body.user.role).toBe(UserRole.ADMIN);
    });

    it('should return 409 for duplicate email', async () => {
      const registerDto = {
        email: 'duplicate@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      // First registration
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(registerDto)
        .expect(201);

      // Second registration with same email
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(registerDto)
        .expect(409);

      expect(response.body.message).toContain('already exists');
    });

    it('should validate required fields', async () => {
      const invalidDto = {
        email: 'invalid-email',
        password: '123', // Too short
        firstName: '',
        lastName: '',
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(invalidDto)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain('email must be an email');
      expect(response.body.message).toContain('password must be longer than or equal to 6 characters');
    });

    it('should validate email format', async () => {
      const invalidDto = {
        email: 'not-an-email',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(invalidDto)
        .expect(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Register a user for login tests using service directly
      await authService.register({
        email: 'login@example.com',
        password: 'password123',
        firstName: 'Login',
        lastName: 'User',
      });
    });

    it('should login with valid credentials', async () => {
      const loginDto = {
        email: 'login@example.com',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(loginDto)
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(loginDto.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should return 401 for invalid password', async () => {
      const loginDto = {
        email: 'login@example.com',
        password: 'wrongpassword',
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(loginDto)
        .expect(401);

      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should return 401 for non-existent user', async () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(loginDto)
        .expect(401);

      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should validate login input', async () => {
      const invalidDto = {
        email: 'not-an-email',
        password: '',
      };

      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(invalidDto)
        .expect(400);
    });
  });

  describe('GET /api/auth/profile', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Register and login to get token
      const registerResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'profile@example.com',
          password: 'password123',
          firstName: 'Profile',
          lastName: 'User',
        });

      accessToken = registerResponse.body.access_token;
    });

    it('should return user profile with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email', 'profile@example.com');
      expect(response.body).toHaveProperty('firstName', 'Profile');
      expect(response.body).toHaveProperty('lastName', 'User');
      expect(response.body).toHaveProperty('role', UserRole.USER);
      expect(response.body).toHaveProperty('isActive', true);
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
      expect(response.body).not.toHaveProperty('password');
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/profile')
        .expect(401);
    });

    it('should return 401 with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should return 401 with malformed token', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);
    });
  });

  describe('Role-based endpoints', () => {
    let userToken: string;
    let adminToken: string;

    beforeEach(async () => {
      // Register regular user
      const userResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'user@example.com',
          password: 'password123',
          firstName: 'Regular',
          lastName: 'User',
        });
      userToken = userResponse.body.access_token;

      // Register admin user
      const adminResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'admin@example.com',
          password: 'password123',
          firstName: 'Admin',
          lastName: 'User',
          role: UserRole.ADMIN,
        });
      adminToken = adminResponse.body.access_token;
    });

    describe('GET /api/auth/admin-only', () => {
      it('should allow admin to access admin-only endpoint', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/auth/admin-only')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.message).toBe('This is an admin-only endpoint');
        expect(response.body.user.role).toBe(UserRole.ADMIN);
      });

      it('should deny user access to admin-only endpoint', async () => {
        await request(app.getHttpServer())
          .get('/api/auth/admin-only')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(403);
      });

      it('should deny access without token', async () => {
        await request(app.getHttpServer())
          .get('/api/auth/admin-only')
          .expect(401);
      });
    });

    describe('GET /api/auth/user-or-admin', () => {
      it('should allow user to access user-or-admin endpoint', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/auth/user-or-admin')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);

        expect(response.body.message).toBe('This endpoint is accessible to both users and admins');
        expect(response.body.user.role).toBe(UserRole.USER);
      });

      it('should allow admin to access user-or-admin endpoint', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/auth/user-or-admin')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.message).toBe('This endpoint is accessible to both users and admins');
        expect(response.body.user.role).toBe(UserRole.ADMIN);
      });

      it('should deny access without token', async () => {
        await request(app.getHttpServer())
          .get('/api/auth/user-or-admin')
          .expect(401);
      });
    });
  });

  describe('JWT Token validation', () => {
    it('should reject expired token', async () => {
      // This test would require a token with past expiration
      // In real scenario, you'd generate a token with short expiration
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImlhdCI6MTYwOTQ1OTIwMCwiZXhwIjoxNjA5NDU5MjAwfQ.invalid';
      
      await request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });

    it('should reject token with invalid signature', async () => {
      const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSJ9.invalid';
      
      await request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);
    });
  });
});
