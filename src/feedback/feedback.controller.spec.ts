import { Test, TestingModule } from '@nestjs/testing';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto, ModerateFeedbackDto, ListFeedbackQueryDto } from './dto/feedback.dto';
import { FeedbackStatus } from './entities/feedback.entity';
import { ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';

describe('FeedbackController', () => {
  let controller: FeedbackController;
  let service: FeedbackService;

  const mockFeedbackService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    moderate: jest.fn(),
    remove: jest.fn(),
    findByBook: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeedbackController],
      providers: [
        {
          provide: FeedbackService,
          useValue: mockFeedbackService,
        },
      ],
    }).compile();

    controller = module.get<FeedbackController>(FeedbackController);
    service = module.get<FeedbackService>(FeedbackService);
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

      const mockFeedback = {
        id: 1,
        rating: 5,
        comment: 'Great book!',
        status: 'visible',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { id: 1, firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
        book: { id: 1, title: 'Test Book', author: 'Test Author', isbn: '978-0-123456-78-9' },
      };

      const mockRequest = { user: { id: 1 } };

      mockFeedbackService.create.mockResolvedValue(mockFeedback);

      const result = await controller.create(createFeedbackDto, mockRequest);

      expect(service.create).toHaveBeenCalledWith(createFeedbackDto, 1);
      expect(result).toEqual({
        message: 'Feedback created successfully',
        feedback: mockFeedback,
      });
    });

    it('should handle service errors', async () => {
      const createFeedbackDto: CreateFeedbackDto = {
        rating: 5,
        comment: 'Great book!',
        bookId: 1,
      };

      const mockRequest = { user: { id: 1 } };

      mockFeedbackService.create.mockRejectedValue(new ConflictException('You have already left feedback for this book'));

      await expect(controller.create(createFeedbackDto, mockRequest)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return paginated feedbacks', async () => {
      const queryDto: ListFeedbackQueryDto = { page: 1, limit: 10 };
      const mockResult = {
        data: [
          {
            id: 1,
            rating: 5,
            comment: 'Great book!',
            status: 'visible',
            createdAt: new Date(),
            updatedAt: new Date(),
            user: { id: 1, firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
            book: { id: 1, title: 'Test Book', author: 'Test Author', isbn: '978-0-123456-78-9' },
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      mockFeedbackService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(queryDto);

      expect(service.findAll).toHaveBeenCalledWith(queryDto, false);
      expect(result).toEqual(mockResult);
    });
  });

  describe('findAllForAdmin', () => {
    it('should return all feedbacks for admin', async () => {
      const queryDto: ListFeedbackQueryDto = { page: 1, limit: 10, status: FeedbackStatus.HIDDEN };
      const mockResult = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      };

      mockFeedbackService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAllForAdmin(queryDto);

      expect(service.findAll).toHaveBeenCalledWith(queryDto, true);
      expect(result).toEqual(mockResult);
    });
  });

  describe('findByBook', () => {
    it('should return feedbacks for a specific book', async () => {
      const queryDto: ListFeedbackQueryDto = { page: 1, limit: 10 };
      const mockResult = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      };

      mockFeedbackService.findByBook.mockResolvedValue(mockResult);

      const result = await controller.findByBook(1, queryDto);

      expect(service.findByBook).toHaveBeenCalledWith(1, queryDto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('findOne', () => {
    it('should return feedback by id', async () => {
      const mockFeedback = {
        id: 1,
        rating: 5,
        comment: 'Great book!',
        status: 'visible',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { id: 1, firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
        book: { id: 1, title: 'Test Book', author: 'Test Author', isbn: '978-0-123456-78-9' },
      };

      const mockRequest = { user: { id: 1, role: 'user' } };

      mockFeedbackService.findOne.mockResolvedValue(mockFeedback);

      const result = await controller.findOne(1, mockRequest);

      expect(service.findOne).toHaveBeenCalledWith(1, 1, false);
      expect(result).toEqual(mockFeedback);
    });

    it('should handle admin users correctly', async () => {
      const mockFeedback = {
        id: 1,
        rating: 5,
        comment: 'Great book!',
        status: 'hidden',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { id: 1, firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
        book: { id: 1, title: 'Test Book', author: 'Test Author', isbn: '978-0-123456-78-9' },
      };

      const mockRequest = { user: { id: 1, role: 'admin' } };

      mockFeedbackService.findOne.mockResolvedValue(mockFeedback);

      const result = await controller.findOne(1, mockRequest);

      expect(service.findOne).toHaveBeenCalledWith(1, 1, true);
      expect(result).toEqual(mockFeedback);
    });

    it('should handle not found error', async () => {
      const mockRequest = { user: { id: 1, role: 'user' } };

      mockFeedbackService.findOne.mockRejectedValue(new NotFoundException('Feedback not found'));

      await expect(controller.findOne(999, mockRequest)).rejects.toThrow(NotFoundException);
    });
  });

  describe('moderate', () => {
    it('should moderate feedback successfully', async () => {
      const moderateFeedbackDto: ModerateFeedbackDto = { status: FeedbackStatus.HIDDEN };
      const mockFeedback = {
        id: 1,
        rating: 5,
        comment: 'Great book!',
        status: 'hidden',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { id: 1, firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
        book: { id: 1, title: 'Test Book', author: 'Test Author', isbn: '978-0-123456-78-9' },
      };

      mockFeedbackService.moderate.mockResolvedValue(mockFeedback);

      const result = await controller.moderate(1, moderateFeedbackDto);

      expect(service.moderate).toHaveBeenCalledWith(1, moderateFeedbackDto);
      expect(result).toEqual({
        message: 'Feedback moderated successfully',
        feedback: mockFeedback,
      });
    });

    it('should handle service errors', async () => {
      const moderateFeedbackDto: ModerateFeedbackDto = { status: FeedbackStatus.HIDDEN };

      mockFeedbackService.moderate.mockRejectedValue(new NotFoundException('Feedback not found'));

      await expect(controller.moderate(999, moderateFeedbackDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete feedback successfully for admin', async () => {
      const mockRequest = { user: { id: 1, role: 'admin' } };

      mockFeedbackService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(1, mockRequest);

      expect(service.remove).toHaveBeenCalledWith(1, 1, true);
      expect(result).toEqual({
        message: 'Feedback deleted successfully',
      });
    });

    it('should delete own feedback successfully', async () => {
      const mockRequest = { user: { id: 1, role: 'user' } };

      mockFeedbackService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(1, mockRequest);

      expect(service.remove).toHaveBeenCalledWith(1, 1, false);
      expect(result).toEqual({
        message: 'Feedback deleted successfully',
      });
    });

    it('should handle forbidden error', async () => {
      const mockRequest = { user: { id: 1, role: 'user' } };

      mockFeedbackService.remove.mockRejectedValue(new ForbiddenException('You can only delete your own feedback'));

      await expect(controller.remove(1, mockRequest)).rejects.toThrow(ForbiddenException);
    });

    it('should handle not found error', async () => {
      const mockRequest = { user: { id: 1, role: 'user' } };

      mockFeedbackService.remove.mockRejectedValue(new NotFoundException('Feedback not found'));

      await expect(controller.remove(999, mockRequest)).rejects.toThrow(NotFoundException);
    });
  });
});
