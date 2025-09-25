import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Repository } from 'typeorm';
import * as request from 'supertest';

import { BooksModule } from './books.module';
import { BooksService } from './books.service';
import { Book } from './entities/book.entity';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
import { LocalStrategy } from '../auth/strategies/local.strategy';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthService } from '../auth/auth.service';
import { User, UserRole } from '../auth/entities/user.entity';
import { ConfigService } from '@nestjs/config';

describe('Books Integration Tests', () => {
  let app: INestApplication;
  let booksService: BooksService;
  let authService: AuthService;
  let bookRepository: Repository<Book>;
  let userRepository: Repository<User>;

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
          entities: [User, Book],
          synchronize: true,
          logging: false,
        }),
        BooksModule,
        TypeOrmModule.forFeature([User]),
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
    
    booksService = moduleFixture.get<BooksService>(BooksService);
    authService = moduleFixture.get<AuthService>(AuthService);
    bookRepository = moduleFixture.get<Repository<Book>>(getRepositoryToken(Book));
    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up database before each test
    try {
      await bookRepository.clear();
      await userRepository.clear();
    } catch (error) {
      // Fallback: delete all records if clear() fails
      const books = await bookRepository.find();
      const users = await userRepository.find();
      if (books.length > 0) {
        await bookRepository.remove(books);
      }
      if (users.length > 0) {
        await userRepository.remove(users);
      }
    }
  });

  describe('POST /api/books', () => {
    let accessToken: string;

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
    });

    it('should create a book successfully', async () => {
      const createBookDto = {
        title: 'Test Book',
        author: 'Test Author',
        isbn: '978-0-123456-78-9',
      };

      const response = await request(app.getHttpServer())
        .post('/api/books')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createBookDto)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Book created successfully');
      expect(response.body).toHaveProperty('book');
      expect(response.body.book.title).toBe(createBookDto.title);
      expect(response.body.book.author).toBe(createBookDto.author);
      expect(response.body.book.isbn).toBe(createBookDto.isbn);
      expect(response.body.book).toHaveProperty('id');
      expect(response.body.book).toHaveProperty('createdAt');
      expect(response.body.book).toHaveProperty('updatedAt');

      const bookInDb = await bookRepository.findOne({ where: { isbn: createBookDto.isbn } });
      expect(bookInDb).toBeDefined();
      expect(bookInDb?.title).toBe(createBookDto.title);
    });

    it('should return 409 for duplicate ISBN', async () => {
      const createBookDto = {
        title: 'Test Book',
        author: 'Test Author',
        isbn: '978-0-123456-78-9',
      };

      // Create first book
      await request(app.getHttpServer())
        .post('/api/books')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createBookDto)
        .expect(201);

      // Try to create second book with same ISBN
      const response = await request(app.getHttpServer())
        .post('/api/books')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createBookDto)
        .expect(409);

      expect(response.body.message).toBe('A book with this ISBN already exists');
    });

    it('should validate required fields', async () => {
      const invalidDto = {
        title: '', // Empty title
        author: '', // Empty author
        isbn: 'invalid-isbn', // Invalid ISBN
      };

      const response = await request(app.getHttpServer())
        .post('/api/books')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidDto)
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message).toContain('title should not be empty');
      expect(response.body.message).toContain('author should not be empty');
      expect(response.body.message).toContain('isbn must be a valid ISBN');
    });

    it('should return 401 without token', async () => {
      const createBookDto = {
        title: 'Test Book',
        author: 'Test Author',
        isbn: '978-0-123456-78-9',
      };

      await request(app.getHttpServer())
        .post('/api/books')
        .send(createBookDto)
        .expect(401);
    });
  });

  describe('GET /api/books', () => {
    beforeEach(async () => {
      // Create test books
      const books = [
        { title: 'Book 1', author: 'Author 1', isbn: '978-0-123456-78-1' },
        { title: 'Book 2', author: 'Author 2', isbn: '978-0-123456-78-2' },
        { title: 'Test Book', author: 'Test Author', isbn: '978-0-123456-78-3' },
      ];

      for (const book of books) {
        await bookRepository.save(bookRepository.create(book));
      }
    });

    it('should return all books with pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/books')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total', 3);
      expect(response.body).toHaveProperty('page', 1);
      expect(response.body).toHaveProperty('limit', 10);
      expect(response.body).toHaveProperty('totalPages', 1);
      expect(response.body.data).toHaveLength(3);
    });

    it('should filter books by title', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/books?title=Test')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Test Book');
    });

    it('should filter books by author', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/books?author=Author 1')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].author).toBe('Author 1');
    });

    it('should filter books by ISBN', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/books?isbn=978-0-123456-78-2')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].isbn).toBe('978-0-123456-78-2');
    });

    it('should handle pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/books?page=1&limit=2')
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(2);
      expect(response.body.totalPages).toBe(2);
    });
  });

  describe('GET /api/books/:id', () => {
    let bookId: number;

    beforeEach(async () => {
      const book = await bookRepository.save(bookRepository.create({
        title: 'Test Book',
        author: 'Test Author',
        isbn: '978-0-123456-78-9',
      }));
      bookId = book.id;
    });

    it('should return a book by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/books/${bookId}`)
        .expect(200);

      expect(response.body.id).toBe(bookId);
      expect(response.body.title).toBe('Test Book');
      expect(response.body.author).toBe('Test Author');
      expect(response.body.isbn).toBe('978-0-123456-78-9');
    });

    it('should return 404 for non-existent book', async () => {
      await request(app.getHttpServer())
        .get('/api/books/999')
        .expect(404);
    });
  });

  describe('PATCH /api/books/:id', () => {
    let accessToken: string;
    let bookId: number;

    beforeEach(async () => {
      // Register an admin user
      const registerResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'admin@example.com',
          password: 'password123',
          firstName: 'Admin',
          lastName: 'User',
          role: UserRole.ADMIN,
        })
        .expect(201);
      accessToken = registerResponse.body.access_token;

      // Create a book
      const book = await bookRepository.save(bookRepository.create({
        title: 'Original Book',
        author: 'Original Author',
        isbn: '978-0-123456-78-9',
      }));
      bookId = book.id;
    });

    it('should update a book successfully', async () => {
      const updateDto = {
        title: 'Updated Book',
        author: 'Updated Author',
      };

      const response = await request(app.getHttpServer())
        .patch(`/api/books/${bookId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Book updated successfully');
      expect(response.body.book.title).toBe(updateDto.title);
      expect(response.body.book.author).toBe(updateDto.author);
      expect(response.body.book.isbn).toBe('978-0-123456-78-9'); // Unchanged

      const bookInDb = await bookRepository.findOne({ where: { id: bookId } });
      expect(bookInDb?.title).toBe(updateDto.title);
      expect(bookInDb?.author).toBe(updateDto.author);
    });

    it('should return 403 for non-admin user', async () => {
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
      const userToken = userResponse.body.access_token;

      const updateDto = { title: 'Updated Book' };

      await request(app.getHttpServer())
        .patch(`/api/books/${bookId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateDto)
        .expect(403);
    });

    it('should return 401 without token', async () => {
      const updateDto = { title: 'Updated Book' };

      await request(app.getHttpServer())
        .patch(`/api/books/${bookId}`)
        .send(updateDto)
        .expect(401);
    });
  });

  describe('DELETE /api/books/:id', () => {
    let accessToken: string;
    let bookId: number;

    beforeEach(async () => {
      // Register an admin user
      const registerResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'admin@example.com',
          password: 'password123',
          firstName: 'Admin',
          lastName: 'User',
          role: UserRole.ADMIN,
        })
        .expect(201);
      accessToken = registerResponse.body.access_token;

      // Create a book
      const book = await bookRepository.save(bookRepository.create({
        title: 'Test Book',
        author: 'Test Author',
        isbn: '978-0-123456-78-9',
      }));
      bookId = book.id;
    });

    it('should delete a book successfully', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/books/${bookId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Book deleted successfully');

      const bookInDb = await bookRepository.findOne({ where: { id: bookId } });
      expect(bookInDb).toBeNull();
    });

    it('should return 404 for non-existent book', async () => {
      await request(app.getHttpServer())
        .delete('/api/books/999')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should return 403 for non-admin user', async () => {
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
      const userToken = userResponse.body.access_token;

      await request(app.getHttpServer())
        .delete(`/api/books/${bookId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer())
        .delete(`/api/books/${bookId}`)
        .expect(401);
    });
  });
});
