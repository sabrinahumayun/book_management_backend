import { Test, TestingModule } from '@nestjs/testing';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';
import { CreateBookDto, UpdateBookDto, ListBooksQueryDto } from './dto/books.dto';
import { ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';

describe('BooksController', () => {
  let controller: BooksController;
  let service: BooksService;

  const mockBooksService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findByUser: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BooksController],
      providers: [
        {
          provide: BooksService,
          useValue: mockBooksService,
        },
      ],
    }).compile();

    controller = module.get<BooksController>(BooksController);
    service = module.get<BooksService>(BooksService);
  });

  afterEach(() => {
    jest.clearAllMocks();
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

      mockBooksService.create.mockResolvedValue(mockBook);

      const result = await controller.create(createBookDto, { user: { id: 1 } });

      expect(service.create).toHaveBeenCalledWith(createBookDto, 1);
      expect(result).toEqual({
        message: 'Book created successfully',
        book: mockBook,
      });
    });

    it('should handle service errors', async () => {
      const createBookDto: CreateBookDto = {
        title: 'Test Book',
        author: 'Test Author',
        isbn: '978-0-123456-78-9',
      };

      mockBooksService.create.mockRejectedValue(new ConflictException('ISBN already exists'));

      await expect(controller.create(createBookDto, { user: { id: 1 } })).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return paginated books', async () => {
      const queryDto: ListBooksQueryDto = { page: 1, limit: 10 };
      const mockResult = {
        data: [
          {
            id: 1,
            title: 'Book 1',
            author: 'Author 1',
            isbn: '978-0-123456-78-9',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      mockBooksService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(queryDto);

      expect(service.findAll).toHaveBeenCalledWith(queryDto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('findMyBooks', () => {
    it('should return paginated books for logged in user', async () => {
      const queryDto: ListBooksQueryDto = { page: 1, limit: 10 };
      const mockResult = {
        data: [
          {
            id: 1,
            title: 'My Book 1',
            author: 'Author 1',
            isbn: '978-0-123456-78-9',
            createdBy: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      const mockRequest = { user: { id: 1 } };

      mockBooksService.findByUser.mockResolvedValue(mockResult);

      const result = await controller.findMyBooks(mockRequest, queryDto);

      expect(service.findByUser).toHaveBeenCalledWith(1, queryDto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('findOne', () => {
    it('should return a book by id', async () => {
      const mockBook = {
        id: 1,
        title: 'Test Book',
        author: 'Test Author',
        isbn: '978-0-123456-78-9',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockBooksService.findOne.mockResolvedValue(mockBook);

      const result = await controller.findOne(1);

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockBook);
    });

    it('should handle not found error', async () => {
      mockBooksService.findOne.mockRejectedValue(new NotFoundException('Book not found'));

      await expect(controller.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a book successfully', async () => {
      const updateBookDto: UpdateBookDto = {
        title: 'Updated Book',
        author: 'Updated Author',
      };

      const mockBook = {
        id: 1,
        title: 'Updated Book',
        author: 'Updated Author',
        isbn: '978-0-123456-78-9',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockBooksService.update.mockResolvedValue(mockBook);

      const result = await controller.update(1, updateBookDto, { user: { id: 1, role: 'admin' } });

      expect(service.update).toHaveBeenCalledWith(1, updateBookDto, 1, 'admin');
      expect(result).toEqual({
        message: 'Book updated successfully',
        book: mockBook,
      });
    });

    it('should handle service errors', async () => {
      const updateBookDto: UpdateBookDto = { title: 'Updated Book' };

      mockBooksService.update.mockRejectedValue(new NotFoundException('Book not found'));

      await expect(controller.update(999, updateBookDto, { user: { id: 1, role: 'admin' } })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a book successfully for admin', async () => {
      mockBooksService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(1, { user: { id: 1, role: 'admin' } });

      expect(service.remove).toHaveBeenCalledWith(1, 1, 'admin');
      expect(result).toEqual({
        message: 'Book deleted successfully',
      });
    });

    it('should delete own book successfully for user', async () => {
      mockBooksService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(1, { user: { id: 1, role: 'user' } });

      expect(service.remove).toHaveBeenCalledWith(1, 1, 'user');
      expect(result).toEqual({
        message: 'Book deleted successfully',
      });
    });

    it('should handle forbidden error', async () => {
      mockBooksService.remove.mockRejectedValue(new ForbiddenException('You can only delete your own books'));

      await expect(controller.remove(1, { user: { id: 1, role: 'user' } })).rejects.toThrow(ForbiddenException);
    });

    it('should handle not found error', async () => {
      mockBooksService.remove.mockRejectedValue(new NotFoundException('Book not found'));

      await expect(controller.remove(999, { user: { id: 1, role: 'admin' } })).rejects.toThrow(NotFoundException);
    });
  });
});
