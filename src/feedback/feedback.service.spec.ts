import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import { ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { Feedback, FeedbackStatus } from './entities/feedback.entity';
import { User, UserRole } from '../auth/entities/user.entity';
import { Book } from '../books/entities/book.entity';
import { CreateFeedbackDto, ModerateFeedbackDto, ListFeedbackQueryDto } from './dto/feedback.dto';

describe('FeedbackService', () => {
  let service: FeedbackService;
  let feedbackRepository: Repository<Feedback>;
  let userRepository: Repository<User>;
  let bookRepository: Repository<Book>;

  const mockFeedbackRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
    remove: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockBookRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedbackService,
        {
          provide: getRepositoryToken(Feedback),
          useValue: mockFeedbackRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Book),
          useValue: mockBookRepository,
        },
      ],
    }).compile();

    service = module.get<FeedbackService>(FeedbackService);
    feedbackRepository = module.get<Repository<Feedback>>(getRepositoryToken(Feedback));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    bookRepository = module.get<Repository<Book>>(getRepositoryToken(Book));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create feedback successfully', async () => {
      const createFeedbackDto: CreateFeedbackDto = {
        rating: 5,
        comment: 'Great book!',
        bookId: 1,
      };

      const mockUser = { id: 1, firstName: 'John', lastName: 'Doe', email: 'john@example.com' };
      const mockBook = { id: 1, title: 'Test Book', author: 'Test Author', isbn: '978-0-123456-78-9' };
      const mockFeedback = {
        id: 1,
        rating: 5,
        comment: 'Great book!',
        status: FeedbackStatus.VISIBLE,
        userId: 1,
        bookId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: mockUser,
        book: mockBook,
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockBookRepository.findOne.mockResolvedValue(mockBook);
      mockFeedbackRepository.findOne.mockResolvedValue(null); // No existing feedback
      mockFeedbackRepository.create.mockReturnValue(mockFeedback);
      mockFeedbackRepository.save.mockResolvedValue(mockFeedback);

      const result = await service.create(createFeedbackDto, 1);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mockBookRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mockFeedbackRepository.findOne).toHaveBeenCalledWith({ where: { userId: 1, bookId: 1 } });
      expect(mockFeedbackRepository.create).toHaveBeenCalledWith({
        rating: 5,
        comment: 'Great book!',
        userId: 1,
        bookId: 1,
        status: FeedbackStatus.VISIBLE,
      });
      expect(result).toEqual({
        id: 1,
        rating: 5,
        comment: 'Great book!',
        status: FeedbackStatus.VISIBLE,
        createdAt: mockFeedback.createdAt,
        updatedAt: mockFeedback.updatedAt,
        user: {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
        book: {
          id: 1,
          title: 'Test Book',
          author: 'Test Author',
          isbn: '978-0-123456-78-9',
        },
      });
    });

    it('should throw NotFoundException when book not found', async () => {
      const createFeedbackDto: CreateFeedbackDto = {
        rating: 5,
        comment: 'Great book!',
        bookId: 999,
      };

      mockBookRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createFeedbackDto, 1)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when user not found', async () => {
      const createFeedbackDto: CreateFeedbackDto = {
        rating: 5,
        comment: 'Great book!',
        bookId: 1,
      };

      const mockBook = { id: 1, title: 'Test Book', author: 'Test Author', isbn: '978-0-123456-78-9' };
      mockBookRepository.findOne.mockResolvedValue(mockBook);
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createFeedbackDto, 999)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when user already left feedback for book', async () => {
      const createFeedbackDto: CreateFeedbackDto = {
        rating: 5,
        comment: 'Great book!',
        bookId: 1,
      };

      const mockUser = { id: 1, firstName: 'John', lastName: 'Doe', email: 'john@example.com' };
      const mockBook = { id: 1, title: 'Test Book', author: 'Test Author', isbn: '978-0-123456-78-9' };
      const existingFeedback = { id: 1, userId: 1, bookId: 1 };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockBookRepository.findOne.mockResolvedValue(mockBook);
      mockFeedbackRepository.findOne.mockResolvedValue(existingFeedback);

      await expect(service.create(createFeedbackDto, 1)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return paginated feedbacks for regular users (visible only)', async () => {
      const queryDto: ListFeedbackQueryDto = { page: 1, limit: 10 };
      const mockFeedbacks = [
        {
          id: 1,
          rating: 5,
          comment: 'Great book!',
          status: FeedbackStatus.VISIBLE,
          createdAt: new Date(),
          updatedAt: new Date(),
          user: { id: 1, firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
          book: { id: 1, title: 'Test Book', author: 'Test Author', isbn: '978-0-123456-78-9' },
        },
      ];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockFeedbacks),
      };

      mockFeedbackRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll(queryDto, false);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('feedback.status = :status', { status: FeedbackStatus.VISIBLE });
      expect(result).toEqual({
        data: mockFeedbacks.map(feedback => ({
          id: feedback.id,
          rating: feedback.rating,
          comment: feedback.comment,
          status: feedback.status,
          createdAt: feedback.createdAt,
          updatedAt: feedback.updatedAt,
          user: {
            id: feedback.user.id,
            firstName: feedback.user.firstName,
            lastName: feedback.user.lastName,
            email: feedback.user.email,
          },
          book: {
            id: feedback.book.id,
            title: feedback.book.title,
            author: feedback.book.author,
            isbn: feedback.book.isbn,
          },
        })),
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should return all feedbacks for admin users', async () => {
      const queryDto: ListFeedbackQueryDto = { page: 1, limit: 10, status: FeedbackStatus.HIDDEN };
      const mockFeedbacks = [
        {
          id: 1,
          rating: 5,
          comment: 'Great book!',
          status: FeedbackStatus.HIDDEN,
          createdAt: new Date(),
          updatedAt: new Date(),
          user: { id: 1, firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
          book: { id: 1, title: 'Test Book', author: 'Test Author', isbn: '978-0-123456-78-9' },
        },
      ];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockFeedbacks),
      };

      mockFeedbackRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll(queryDto, true);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('feedback.status = :status', { status: FeedbackStatus.HIDDEN });
      expect(result.data).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return feedback for admin users', async () => {
      const mockFeedback = {
        id: 1,
        rating: 5,
        comment: 'Great book!',
        status: FeedbackStatus.HIDDEN,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { id: 1, firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
        book: { id: 1, title: 'Test Book', author: 'Test Author', isbn: '978-0-123456-78-9' },
      };

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockFeedback),
      };

      mockFeedbackRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findOne(1, 1, true);

      expect(result).toEqual({
        id: 1,
        rating: 5,
        comment: 'Great book!',
        status: FeedbackStatus.HIDDEN,
        createdAt: mockFeedback.createdAt,
        updatedAt: mockFeedback.updatedAt,
        user: {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
        book: {
          id: 1,
          title: 'Test Book',
          author: 'Test Author',
          isbn: '978-0-123456-78-9',
        },
      });
    });

    it('should throw NotFoundException when feedback not found', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };

      mockFeedbackRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await expect(service.findOne(999, 1, false)).rejects.toThrow(NotFoundException);
    });
  });

  describe('moderate', () => {
    it('should moderate feedback successfully', async () => {
      const moderateFeedbackDto: ModerateFeedbackDto = { status: FeedbackStatus.HIDDEN };
      const mockFeedback = {
        id: 1,
        rating: 5,
        comment: 'Great book!',
        status: FeedbackStatus.VISIBLE,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { id: 1, firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
        book: { id: 1, title: 'Test Book', author: 'Test Author', isbn: '978-0-123456-78-9' },
      };

      mockFeedbackRepository.findOne.mockResolvedValue(mockFeedback);
      mockFeedbackRepository.save.mockResolvedValue({ ...mockFeedback, status: FeedbackStatus.HIDDEN });

      const result = await service.moderate(1, moderateFeedbackDto);

      expect(mockFeedbackRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['user', 'book'],
      });
      expect(mockFeedbackRepository.save).toHaveBeenCalledWith({ ...mockFeedback, status: FeedbackStatus.HIDDEN });
      expect(result.status).toBe(FeedbackStatus.HIDDEN);
    });

    it('should throw NotFoundException when feedback not found', async () => {
      const moderateFeedbackDto: ModerateFeedbackDto = { status: FeedbackStatus.HIDDEN };

      mockFeedbackRepository.findOne.mockResolvedValue(null);

      await expect(service.moderate(999, moderateFeedbackDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove feedback successfully for admin', async () => {
      const mockFeedback = {
        id: 1,
        userId: 2,
        user: { id: 2, firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com' },
      };

      mockFeedbackRepository.findOne.mockResolvedValue(mockFeedback);
      mockFeedbackRepository.remove.mockResolvedValue(mockFeedback);

      await service.remove(1, 1, true);

      expect(mockFeedbackRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['user'],
      });
      expect(mockFeedbackRepository.remove).toHaveBeenCalledWith(mockFeedback);
    });

    it('should remove own feedback successfully', async () => {
      const mockFeedback = {
        id: 1,
        userId: 1,
        user: { id: 1, firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
      };

      mockFeedbackRepository.findOne.mockResolvedValue(mockFeedback);
      mockFeedbackRepository.remove.mockResolvedValue(mockFeedback);

      await service.remove(1, 1, false);

      expect(mockFeedbackRepository.remove).toHaveBeenCalledWith(mockFeedback);
    });

    it('should throw ForbiddenException when user tries to delete someone else feedback', async () => {
      const mockFeedback = {
        id: 1,
        userId: 2,
        user: { id: 2, firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com' },
      };

      mockFeedbackRepository.findOne.mockResolvedValue(mockFeedback);

      await expect(service.remove(1, 1, false)).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when feedback not found', async () => {
      mockFeedbackRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999, 1, false)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByBook', () => {
    it('should return feedbacks for a specific book', async () => {
      const mockBook = { id: 1, title: 'Test Book', author: 'Test Author', isbn: '978-0-123456-78-9' };
      mockBookRepository.findOne.mockResolvedValue(mockBook);

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      mockFeedbackRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findByBook(1, { page: 1, limit: 10 });

      expect(mockBookRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('feedback.bookId = :bookId', { bookId: 1 });
      expect(result).toEqual({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      });
    });

    it('should throw NotFoundException when book not found', async () => {
      mockBookRepository.findOne.mockResolvedValue(null);

      await expect(service.findByBook(999, { page: 1, limit: 10 })).rejects.toThrow(NotFoundException);
    });
  });
});
