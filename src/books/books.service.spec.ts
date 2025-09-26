import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import { ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { BooksService } from './books.service';
import { Book } from './entities/book.entity';
import { CreateBookDto, UpdateBookDto, ListBooksQueryDto } from './dto/books.dto';

describe('BooksService', () => {
  let service: BooksService;
  let repository: Repository<Book>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BooksService,
        {
          provide: getRepositoryToken(Book),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<BooksService>(BooksService);
    repository = module.get<Repository<Book>>(getRepositoryToken(Book));
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  describe('create', () => {
    it('should create a book successfully', async () => {
      const createBookDto: CreateBookDto = {
        title: 'Test Book',
        author: 'Test Author',
        isbn: '978-0-123456-78-9',
      };

      const mockBook = {
        id: 1,
        ...createBookDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create.mockReturnValue(mockBook);
      mockRepository.save.mockResolvedValue(mockBook);

      const result = await service.create(createBookDto, 1);

      expect(mockRepository.create).toHaveBeenCalledWith({ ...createBookDto, createdBy: 1 });
      expect(mockRepository.save).toHaveBeenCalledWith(mockBook);
      expect(result).toEqual({
        id: 1,
        title: 'Test Book',
        author: 'Test Author',
        isbn: '978-0-123456-78-9',
        createdAt: mockBook.createdAt,
        updatedAt: mockBook.updatedAt,
      });
    });

    it('should throw ConflictException when ISBN already exists', async () => {
      const createBookDto: CreateBookDto = {
        title: 'Test Book',
        author: 'Test Author',
        isbn: '978-0-123456-78-9',
      };

      const duplicateKeyError = new QueryFailedError('duplicate key', [], new Error('duplicate key value violates unique constraint'));
      duplicateKeyError.message = 'duplicate key value violates unique constraint';

      mockRepository.create.mockReturnValue({});
      mockRepository.save.mockRejectedValue(duplicateKeyError);

      await expect(service.create(createBookDto, 1)).rejects.toThrow(ConflictException);
    });
  });

  describe('findByUser', () => {
    it('should return paginated books for a specific user', async () => {
      const queryDto: ListBooksQueryDto = { page: 1, limit: 10 };
      const userId = 1;
      const mockBooks = [
        { id: 1, title: 'User Book 1', author: 'Author 1', isbn: '978-0-123456-78-9', createdBy: 1, createdAt: new Date(), updatedAt: new Date() },
        { id: 2, title: 'User Book 2', author: 'Author 2', isbn: '978-0-123456-78-0', createdBy: 1, createdAt: new Date(), updatedAt: new Date() },
      ];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(2),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockBooks),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findByUser(userId, queryDto);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('book.createdBy = :userId', { userId });
      expect(result).toEqual({
        data: mockBooks.map(book => ({
          id: book.id,
          title: book.title,
          author: book.author,
          isbn: book.isbn,
          createdAt: book.createdAt,
          updatedAt: book.updatedAt,
          createdBy: book.createdBy,
          creator: undefined,
        })),
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should apply filters correctly for user books', async () => {
      const queryDto: ListBooksQueryDto = {
        page: 2,
        limit: 5,
        title: 'Test',
        author: 'Author',
        isbn: '978-0-123456-78-9',
      };
      const userId = 1;

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.findByUser(userId, queryDto);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('book.createdBy = :userId', { userId });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('LOWER(book.title) LIKE LOWER(:title)', { title: '%Test%' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('LOWER(book.author) LIKE LOWER(:author)', { author: '%Author%' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('book.isbn = :isbn', { isbn: '978-0-123456-78-9' });
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(5); // (page - 1) * limit
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(5);
    });
  });

  describe('findAll', () => {
    it('should return paginated books with default pagination', async () => {
      const queryDto: ListBooksQueryDto = {};
      const mockBooks = [
        { id: 1, title: 'Book 1', author: 'Author 1', isbn: '978-0-123456-78-9', createdAt: new Date(), updatedAt: new Date() },
        { id: 2, title: 'Book 2', author: 'Author 2', isbn: '978-0-123456-78-0', createdAt: new Date(), updatedAt: new Date() },
      ];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(2),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockBooks),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll(queryDto);

      expect(result).toEqual({
        data: mockBooks.map(book => ({
          id: book.id,
          title: book.title,
          author: book.author,
          isbn: book.isbn,
          createdAt: book.createdAt,
          updatedAt: book.updatedAt,
        })),
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should apply filters correctly', async () => {
      const queryDto: ListBooksQueryDto = {
        page: 2,
        limit: 5,
        title: 'Test',
        author: 'Author',
        isbn: '978-0-123456-78-9',
      };

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.findAll(queryDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('LOWER(book.title) LIKE LOWER(:title)', { title: '%Test%' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('LOWER(book.author) LIKE LOWER(:author)', { author: '%Author%' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('book.isbn = :isbn', { isbn: '978-0-123456-78-9' });
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(5); // (page - 1) * limit
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(5);
    });
  });

  describe('findOne', () => {
    it('should return a book when found', async () => {
      const mockBook = {
        id: 1,
        title: 'Test Book',
        author: 'Test Author',
        isbn: '978-0-123456-78-9',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(mockBook);

      const result = await service.findOne(1);

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 }, relations: ['creator'] });
      expect(result).toEqual({
        id: 1,
        title: 'Test Book',
        author: 'Test Author',
        isbn: '978-0-123456-78-9',
        createdAt: mockBook.createdAt,
        updatedAt: mockBook.updatedAt,
      });
    });

    it('should throw NotFoundException when book not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a book successfully', async () => {
      const updateBookDto: UpdateBookDto = {
        title: 'Updated Book',
        author: 'Updated Author',
      };

      const existingBook = {
        id: 1,
        title: 'Original Book',
        author: 'Original Author',
        isbn: '978-0-123456-78-9',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedBook = {
        ...existingBook,
        ...updateBookDto,
        updatedAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValueOnce(existingBook);
      mockRepository.findOne.mockResolvedValueOnce(null); // No duplicate ISBN
      mockRepository.save.mockResolvedValue(updatedBook);

      const result = await service.update(1, updateBookDto, 1, 'admin');

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 }, relations: ['creator'] });
      expect(mockRepository.save).toHaveBeenCalledWith({ ...existingBook, ...updateBookDto });
      expect(result).toEqual({
        id: 1,
        title: 'Updated Book',
        author: 'Updated Author',
        isbn: '978-0-123456-78-9',
        createdAt: existingBook.createdAt,
        updatedAt: updatedBook.updatedAt,
      });
    });

    it('should throw NotFoundException when book not found', async () => {
      const updateBookDto: UpdateBookDto = { title: 'Updated Book' };

      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, updateBookDto, 1, 'admin')).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when ISBN already exists', async () => {
      const updateBookDto: UpdateBookDto = {
        isbn: '978-0-123456-78-0',
      };

      const existingBook = {
        id: 1,
        title: 'Original Book',
        author: 'Original Author',
        isbn: '978-0-123456-78-9',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const duplicateBook = {
        id: 2,
        title: 'Another Book',
        author: 'Another Author',
        isbn: '978-0-123456-78-0',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findOne
        .mockResolvedValueOnce(existingBook) // First call for the book being updated
        .mockResolvedValueOnce(duplicateBook); // Second call for ISBN check

      await expect(service.update(1, updateBookDto, 1, 'admin')).rejects.toThrow(ConflictException);
    });

    it('should allow owner to update their own book', async () => {
      const updateBookDto: UpdateBookDto = {
        title: 'Updated Book',
        author: 'Updated Author',
      };

      const existingBook = {
        id: 1,
        title: 'Original Book',
        author: 'Original Author',
        isbn: '978-0-123456-78-9',
        createdBy: 1, // Same as userId
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedBook = {
        ...existingBook,
        ...updateBookDto,
        updatedAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValueOnce(existingBook);
      mockRepository.findOne.mockResolvedValueOnce(null); // No duplicate ISBN
      mockRepository.save.mockResolvedValue(updatedBook);

      const result = await service.update(1, updateBookDto, 1, 'user');

      expect(result.title).toBe('Updated Book');
      expect(result.author).toBe('Updated Author');
    });

    it('should throw ForbiddenException when user tries to update someone else book', async () => {
      const updateBookDto: UpdateBookDto = { title: 'Updated Book' };

      const existingBook = {
        id: 1,
        title: 'Original Book',
        author: 'Original Author',
        isbn: '978-0-123456-78-9',
        createdBy: 2, // Different from userId (1)
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock the findOne call with relations parameter
      mockRepository.findOne.mockImplementation((options) => {
        if (options.where.id === 1 && options.relations && options.relations.includes('creator')) {
          return Promise.resolve(existingBook);
        }
        return Promise.resolve(null);
      });

      await expect(service.update(1, updateBookDto, 1, 'user')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should remove a book successfully for admin', async () => {
      const mockBook = {
        id: 1,
        title: 'Test Book',
        author: 'Test Author',
        isbn: '978-0-123456-78-9',
        createdBy: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Reset mocks to ensure clean state
      mockRepository.findOne.mockReset();
      mockRepository.remove.mockReset();
      
      mockRepository.findOne.mockResolvedValue(mockBook);
      mockRepository.remove.mockResolvedValue(mockBook);

      await service.remove(1, 1, 'admin');

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mockRepository.remove).toHaveBeenCalledWith(mockBook);
    });

    it('should remove own book successfully for user', async () => {
      const mockBook = {
        id: 1,
        title: 'Test Book',
        author: 'Test Author',
        isbn: '978-0-123456-78-9',
        createdBy: 1, // Same as userId
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(mockBook);
      mockRepository.remove.mockResolvedValue(mockBook);

      await service.remove(1, 1, 'user');

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mockRepository.remove).toHaveBeenCalledWith(mockBook);
    });

    it('should throw ForbiddenException when user tries to delete someone else book', async () => {
      const mockBook = {
        id: 1,
        title: 'Test Book',
        author: 'Test Author',
        isbn: '978-0-123456-78-9',
        createdBy: 2, // Different from userId (1)
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(mockBook);

      await expect(service.remove(1, 1, 'user')).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when book not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999, 1, 'admin')).rejects.toThrow(NotFoundException);
    });
  });
});
