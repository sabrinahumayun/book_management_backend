import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Repository } from 'typeorm';
import * as request from 'supertest';

import { FeedbackModule } from './feedback.module';
import { FeedbackService } from './feedback.service';
import { Feedback, FeedbackStatus } from './entities/feedback.entity';
import { User, UserRole } from '../auth/entities/user.entity';
import { Book } from '../books/entities/book.entity';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
import { LocalStrategy } from '../auth/strategies/local.strategy';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthService } from '../auth/auth.service';

describe('Feedback Integration Tests', () => {
  let app: INestApplication;
  let feedbackService: FeedbackService;
  let authService: AuthService;
  let feedbackRepository: Repository<Feedback>;
  let userRepository: Repository<User>;
  let bookRepository: Repository<Book>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432'),
          username: process.env.DB_USERNAME || 'postgres',
          password: process.env.DB_PASSWORD || 'postgres',
          database: process.env.DB_DATABASE || 'book_management_test',
          entities: [User, Book, Feedback],
          synchronize: true,
          logging: false,
        }),
        FeedbackModule,
        TypeOrmModule.forFeature([User, Book]),
        PassportModule,
        JwtModule.registerAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: async (configService: ConfigService) => ({
            secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
            signOptions: { expiresIn: '24h' },
          }),
        }),
      ],
      providers: [AuthService, JwtStrategy, LocalStrategy, RolesGuard],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Enable validation pipes globally for integration tests
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));
    
    feedbackService = moduleFixture.get<FeedbackService>(FeedbackService);
    authService = moduleFixture.get<AuthService>(AuthService);
    feedbackRepository = moduleFixture.get<Repository<Feedback>>(getRepositoryToken(Feedback));
    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    bookRepository = moduleFixture.get<Repository<Book>>(getRepositoryToken(Book));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up database before each test
    try {
      await feedbackRepository.clear();
      await bookRepository.clear();
      await userRepository.clear();
    } catch (error) {
      // Fallback: delete all records if clear() fails
      const feedbacks = await feedbackRepository.find();
      const books = await bookRepository.find();
      const users = await userRepository.find();
      if (feedbacks.length > 0) {
        await feedbackRepository.remove(feedbacks);
      }
      if (books.length > 0) {
        await bookRepository.remove(books);
      }
      if (users.length > 0) {
        await userRepository.remove(users);
      }
    }
  });

  describe('POST /api/feedback', () => {
    let accessToken: string;
    let bookId: number;

    beforeEach(async () => {
      // Register a user for authentication
      const registerResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(201);
      accessToken = registerResponse.body.access_token;

      // Create a book
      const bookResponse = await request(app.getHttpServer())
        .post('/api/books')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Test Book',
          author: 'Test Author',
          isbn: '978-0-123456-78-9',
        })
        .expect(201);
      bookId = bookResponse.body.book.id;
    });

    it('should create feedback successfully', async () => {
      const createFeedbackDto = {
        rating: 5,
        comment: 'Great book! Highly recommended.',
        bookId: bookId,
      };

      const response = await request(app.getHttpServer())
        .post('/api/feedback')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createFeedbackDto)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Feedback created successfully');
      expect(response.body).toHaveProperty('feedback');
      expect(response.body.feedback.rating).toBe(createFeedbackDto.rating);
      expect(response.body.feedback.comment).toBe(createFeedbackDto.comment);
      expect(response.body.feedback.status).toBe(FeedbackStatus.VISIBLE);
      expect(response.body.feedback).toHaveProperty('id');
      expect(response.body.feedback).toHaveProperty('createdAt');
      expect(response.body.feedback).toHaveProperty('updatedAt');
      expect(response.body.feedback.user).toHaveProperty('id');
      expect(response.body.feedback.user).toHaveProperty('firstName');
      expect(response.body.feedback.user).toHaveProperty('lastName');
      expect(response.body.feedback.user).toHaveProperty('email');
      expect(response.body.feedback.book).toHaveProperty('id');
      expect(response.body.feedback.book).toHaveProperty('title');
      expect(response.body.feedback.book).toHaveProperty('author');
      expect(response.body.feedback.book).toHaveProperty('isbn');

      const feedbackInDb = await feedbackRepository.findOne({ 
        where: { id: response.body.feedback.id },
        relations: ['user', 'book']
      });
      expect(feedbackInDb).toBeDefined();
      expect(feedbackInDb?.rating).toBe(createFeedbackDto.rating);
    });

    it('should return 409 for duplicate feedback from same user', async () => {
      const createFeedbackDto = {
        rating: 5,
        comment: 'Great book!',
        bookId: bookId,
      };

      // Create first feedback
      await request(app.getHttpServer())
        .post('/api/feedback')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createFeedbackDto)
        .expect(201);

      // Try to create second feedback for same book
      const response = await request(app.getHttpServer())
        .post('/api/feedback')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createFeedbackDto)
        .expect(409);

      expect(response.body.message).toBe('You have already left feedback for this book');
    });

    it('should return 404 for non-existent book', async () => {
      const createFeedbackDto = {
        rating: 5,
        comment: 'Great book!',
        bookId: 999,
      };

      const response = await request(app.getHttpServer())
        .post('/api/feedback')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createFeedbackDto)
        .expect(404);

      expect(response.body.message).toBe('Book with ID 999 not found');
    });

    it('should validate required fields', async () => {
      const invalidDto = {
        rating: 6, // Invalid rating (should be 1-5)
        comment: '', // Empty comment
        bookId: 'invalid', // Invalid bookId type
      };

      const response = await request(app.getHttpServer())
        .post('/api/feedback')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidDto)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain('rating must not be greater than 5');
      expect(response.body.message).toContain('comment should not be empty');
      expect(response.body.message).toContain('bookId must be a positive number');
    });

    it('should return 401 without token', async () => {
      const createFeedbackDto = {
        rating: 5,
        comment: 'Great book!',
        bookId: bookId,
      };

      await request(app.getHttpServer())
        .post('/api/feedback')
        .send(createFeedbackDto)
        .expect(401);
    });
  });

  describe('GET /api/feedback', () => {
    let accessToken: string;
    let bookId: number;

    beforeEach(async () => {
      // Register a user and create a book
      const registerResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(201);
      accessToken = registerResponse.body.access_token;

      const bookResponse = await request(app.getHttpServer())
        .post('/api/books')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Test Book',
          author: 'Test Author',
          isbn: '978-0-123456-78-9',
        })
        .expect(201);
      bookId = bookResponse.body.book.id;

      // Create some feedback
      await request(app.getHttpServer())
        .post('/api/feedback')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          rating: 5,
          comment: 'Great book!',
          bookId: bookId,
        })
        .expect(201);
    });

    it('should return all visible feedbacks with pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/feedback')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total', 1);
      expect(response.body).toHaveProperty('page', 1);
      expect(response.body).toHaveProperty('limit', 10);
      expect(response.body).toHaveProperty('totalPages', 1);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toHaveProperty('rating', 5);
      expect(response.body.data[0]).toHaveProperty('comment', 'Great book!');
      expect(response.body.data[0]).toHaveProperty('status', FeedbackStatus.VISIBLE);
    });

    it('should filter feedbacks by bookId', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/feedback?bookId=${bookId}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].book.id).toBe(bookId);
    });

    it('should handle pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/feedback?page=1&limit=5')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(5);
    });
  });

  describe('GET /api/feedback/book/:bookId', () => {
    let accessToken: string;
    let bookId: number;

    beforeEach(async () => {
      // Register a user and create a book
      const registerResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(201);
      accessToken = registerResponse.body.access_token;

      const bookResponse = await request(app.getHttpServer())
        .post('/api/books')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Test Book',
          author: 'Test Author',
          isbn: '978-0-123456-78-9',
        })
        .expect(201);
      bookId = bookResponse.body.book.id;

      // Create feedback for the book
      await request(app.getHttpServer())
        .post('/api/feedback')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          rating: 4,
          comment: 'Good book!',
          bookId: bookId,
        })
        .expect(201);
    });

    it('should return feedbacks for a specific book', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/feedback/book/${bookId}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].book.id).toBe(bookId);
      expect(response.body.data[0].rating).toBe(4);
    });

    it('should return 404 for non-existent book', async () => {
      await request(app.getHttpServer())
        .get('/api/feedback/book/999')
        .expect(404);
    });
  });

  describe('GET /api/feedback/admin', () => {
    let adminToken: string;
    let userToken: string;
    let bookId: number;

    beforeEach(async () => {
      // Register an admin user
      const adminResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'admin@example.com',
          password: 'password123',
          firstName: 'Admin',
          lastName: 'User',
          role: UserRole.ADMIN,
        })
        .expect(201);
      adminToken = adminResponse.body.access_token;

      // Register a regular user
      const userResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'user@example.com',
          password: 'password123',
          firstName: 'User',
          lastName: 'User',
        })
        .expect(201);
      userToken = userResponse.body.access_token;

      // Create a book
      const bookResponse = await request(app.getHttpServer())
        .post('/api/books')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test Book',
          author: 'Test Author',
          isbn: '978-0-123456-78-9',
        })
        .expect(201);
      bookId = bookResponse.body.book.id;

      // Create feedback
      await request(app.getHttpServer())
        .post('/api/feedback')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          rating: 3,
          comment: 'Average book',
          bookId: bookId,
        })
        .expect(201);
    });

    it('should return all feedbacks for admin', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/feedback/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toHaveProperty('rating', 3);
    });

    it('should filter feedbacks by status for admin', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/feedback/admin?status=visible')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe(FeedbackStatus.VISIBLE);
    });

    it('should return 403 for non-admin user', async () => {
      await request(app.getHttpServer())
        .get('/api/feedback/admin')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer())
        .get('/api/feedback/admin')
        .expect(401);
    });
  });

  describe('PATCH /api/feedback/:id/moderate', () => {
    let adminToken: string;
    let userToken: string;
    let feedbackId: number;

    beforeEach(async () => {
      // Register an admin user
      const adminResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'admin@example.com',
          password: 'password123',
          firstName: 'Admin',
          lastName: 'User',
          role: UserRole.ADMIN,
        })
        .expect(201);
      adminToken = adminResponse.body.access_token;

      // Register a regular user
      const userResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'user@example.com',
          password: 'password123',
          firstName: 'User',
          lastName: 'User',
        })
        .expect(201);
      userToken = userResponse.body.access_token;

      // Create a book
      const bookResponse = await request(app.getHttpServer())
        .post('/api/books')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test Book',
          author: 'Test Author',
          isbn: '978-0-123456-78-9',
        })
        .expect(201);

      // Create feedback
      const feedbackResponse = await request(app.getHttpServer())
        .post('/api/feedback')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          rating: 2,
          comment: 'Not good',
          bookId: bookResponse.body.book.id,
        })
        .expect(201);
      feedbackId = feedbackResponse.body.feedback.id;
    });

    it('should moderate feedback successfully', async () => {
      const moderateDto = {
        status: FeedbackStatus.HIDDEN,
      };

      const response = await request(app.getHttpServer())
        .patch(`/api/feedback/${feedbackId}/moderate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(moderateDto)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Feedback moderated successfully');
      expect(response.body.feedback.status).toBe(FeedbackStatus.HIDDEN);

      const feedbackInDb = await feedbackRepository.findOne({ where: { id: feedbackId } });
      expect(feedbackInDb?.status).toBe(FeedbackStatus.HIDDEN);
    });

    it('should return 403 for non-admin user', async () => {
      const moderateDto = {
        status: FeedbackStatus.HIDDEN,
      };

      await request(app.getHttpServer())
        .patch(`/api/feedback/${feedbackId}/moderate`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(moderateDto)
        .expect(403);
    });

    it('should return 404 for non-existent feedback', async () => {
      const moderateDto = {
        status: FeedbackStatus.HIDDEN,
      };

      await request(app.getHttpServer())
        .patch('/api/feedback/999/moderate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(moderateDto)
        .expect(404);
    });
  });

  describe('DELETE /api/feedback/:id', () => {
    let adminToken: string;
    let userToken: string;
    let otherUserToken: string;
    let feedbackId: number;

    beforeEach(async () => {
      // Register an admin user
      const adminResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'admin@example.com',
          password: 'password123',
          firstName: 'Admin',
          lastName: 'User',
          role: UserRole.ADMIN,
        })
        .expect(201);
      adminToken = adminResponse.body.access_token;

      // Register a regular user
      const userResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'user@example.com',
          password: 'password123',
          firstName: 'User',
          lastName: 'User',
        })
        .expect(201);
      userToken = userResponse.body.access_token;

      // Register another user
      const otherUserResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'other@example.com',
          password: 'password123',
          firstName: 'Other',
          lastName: 'User',
        })
        .expect(201);
      otherUserToken = otherUserResponse.body.access_token;

      // Create a book
      const bookResponse = await request(app.getHttpServer())
        .post('/api/books')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test Book',
          author: 'Test Author',
          isbn: '978-0-123456-78-9',
        })
        .expect(201);

      // Create feedback
      const feedbackResponse = await request(app.getHttpServer())
        .post('/api/feedback')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          rating: 4,
          comment: 'Good book',
          bookId: bookResponse.body.book.id,
        })
        .expect(201);
      feedbackId = feedbackResponse.body.feedback.id;
    });

    it('should delete feedback successfully for admin', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/feedback/${feedbackId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Feedback deleted successfully');

      const feedbackInDb = await feedbackRepository.findOne({ where: { id: feedbackId } });
      expect(feedbackInDb).toBeNull();
    });

    it('should delete own feedback successfully', async () => {
      // Create another feedback for the user
      const bookResponse = await request(app.getHttpServer())
        .post('/api/books')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Another Book',
          author: 'Another Author',
          isbn: '978-0-123456-78-0',
        })
        .expect(201);

      const feedbackResponse = await request(app.getHttpServer())
        .post('/api/feedback')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          rating: 5,
          comment: 'Excellent book',
          bookId: bookResponse.body.book.id,
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .delete(`/api/feedback/${feedbackResponse.body.feedback.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Feedback deleted successfully');
    });

    it('should return 403 when user tries to delete someone else feedback', async () => {
      await request(app.getHttpServer())
        .delete(`/api/feedback/${feedbackId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(403);
    });

    it('should return 404 for non-existent feedback', async () => {
      await request(app.getHttpServer())
        .delete('/api/feedback/999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer())
        .delete(`/api/feedback/${feedbackId}`)
        .expect(401);
    });
  });
});