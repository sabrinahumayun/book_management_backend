import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import { Feedback, FeedbackStatus } from './entities/feedback.entity';
import { User } from '../auth/entities/user.entity';
import { Book } from '../books/entities/book.entity';
import { CreateFeedbackDto, ModerateFeedbackDto, UpdateFeedbackDto, ListFeedbackQueryDto, PaginatedFeedbackResponseDto, FeedbackResponseDto } from './dto/feedback.dto';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(Feedback)
    private feedbackRepository: Repository<Feedback>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Book)
    private bookRepository: Repository<Book>,
  ) {}

  async create(createFeedbackDto: CreateFeedbackDto, userId: number): Promise<FeedbackResponseDto> {
    const { bookId, rating, comment } = createFeedbackDto;

    // Check if book exists
    const book = await this.bookRepository.findOne({ where: { id: bookId } });
    if (!book) {
      throw new NotFoundException(`Book with ID ${bookId} not found`);
    }

    // Check if user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Check if user has already left feedback for this book
    const existingFeedback = await this.feedbackRepository.findOne({
      where: { userId, bookId },
    });
    if (existingFeedback) {
      throw new ConflictException('You have already left feedback for this book');
    }

    try {
      const feedback = this.feedbackRepository.create({
        rating,
        comment,
        userId,
        bookId,
        status: FeedbackStatus.VISIBLE,
      });

      const savedFeedback = await this.feedbackRepository.save(feedback);
      
      // Reload with relations
      const feedbackWithRelations = await this.feedbackRepository.createQueryBuilder('feedback')
        .leftJoinAndSelect('feedback.user', 'user')
        .leftJoinAndSelect('feedback.book', 'book')
        .where('feedback.id = :id', { id: savedFeedback.id })
        .getOne();
      
      if (!feedbackWithRelations) {
        throw new Error('Failed to reload feedback with relations');
      }
      
      return this.mapToResponseDto(feedbackWithRelations);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        throw new ConflictException('Failed to create feedback');
      }
      throw error;
    }
  }

  async findAll(queryDto: ListFeedbackQueryDto, isAdmin: boolean = false): Promise<PaginatedFeedbackResponseDto> {
    const { page = 1, limit = 10, bookId, userId, status } = queryDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.feedbackRepository
      .createQueryBuilder('feedback')
      .leftJoinAndSelect('feedback.user', 'user')
      .leftJoinAndSelect('feedback.book', 'book');

    // Apply filters
    if (bookId) {
      queryBuilder.andWhere('feedback.bookId = :bookId', { bookId });
    }
    if (userId) {
      queryBuilder.andWhere('feedback.userId = :userId', { userId });
    }
    if (status) {
      queryBuilder.andWhere('feedback.status = :status', { status });
    } else if (!isAdmin) {
      // Non-admin users only see visible feedback
      queryBuilder.andWhere('feedback.status = :status', { status: FeedbackStatus.VISIBLE });
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination and ordering
    const feedbacks = await queryBuilder
      .orderBy('feedback.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getMany();

    const totalPages = Math.ceil(total / limit);

    return {
      data: feedbacks.map(feedback => this.mapToResponseDto(feedback)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findOne(id: number, userId: number, isAdmin: boolean = false): Promise<FeedbackResponseDto> {
    const queryBuilder = this.feedbackRepository
      .createQueryBuilder('feedback')
      .leftJoinAndSelect('feedback.user', 'user')
      .leftJoinAndSelect('feedback.book', 'book')
      .where('feedback.id = :id', { id });

    if (!isAdmin) {
      queryBuilder.andWhere('feedback.status = :status', { status: FeedbackStatus.VISIBLE });
    }

    const feedback = await queryBuilder.getOne();
    if (!feedback) {
      throw new NotFoundException(`Feedback with ID ${id} not found`);
    }

    return this.mapToResponseDto(feedback);
  }

  async moderate(id: number, moderateFeedbackDto: ModerateFeedbackDto): Promise<FeedbackResponseDto> {
    const feedback = await this.feedbackRepository.findOne({
      where: { id },
      relations: ['user', 'book'],
    });

    if (!feedback) {
      throw new NotFoundException(`Feedback with ID ${id} not found`);
    }

    feedback.status = moderateFeedbackDto.status;
    const updatedFeedback = await this.feedbackRepository.save(feedback);

    return this.mapToResponseDto(updatedFeedback);
  }

  async update(id: number, updateFeedbackDto: UpdateFeedbackDto, userId: number, isAdmin: boolean = false): Promise<FeedbackResponseDto> {
    const feedback = await this.feedbackRepository.findOne({
      where: { id },
      relations: ['user', 'book'],
    });

    if (!feedback) {
      throw new NotFoundException(`Feedback with ID ${id} not found`);
    }

    // Only allow users to update their own feedback or admins to update any feedback
    if (!isAdmin && feedback.userId !== userId) {
      throw new ForbiddenException('You can only update your own feedback');
    }

    // Update only provided fields
    if (updateFeedbackDto.rating !== undefined) {
      feedback.rating = updateFeedbackDto.rating;
    }
    if (updateFeedbackDto.comment !== undefined) {
      feedback.comment = updateFeedbackDto.comment;
    }

    const updatedFeedback = await this.feedbackRepository.save(feedback);

    return this.mapToResponseDto(updatedFeedback);
  }

  async remove(id: number, userId: number, isAdmin: boolean = false): Promise<void> {
    const feedback = await this.feedbackRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!feedback) {
      throw new NotFoundException(`Feedback with ID ${id} not found`);
    }

    // Only allow users to delete their own feedback or admins to delete any feedback
    if (!isAdmin && feedback.userId !== userId) {
      throw new ForbiddenException('You can only delete your own feedback');
    }

    await this.feedbackRepository.remove(feedback);
  }

  async findByBook(bookId: number, queryDto: ListFeedbackQueryDto): Promise<PaginatedFeedbackResponseDto> {
    // Check if book exists
    const book = await this.bookRepository.findOne({ where: { id: bookId } });
    if (!book) {
      throw new NotFoundException(`Book with ID ${bookId} not found`);
    }

    return this.findAll({ ...queryDto, bookId }, false);
  }

  private mapToResponseDto(feedback: Feedback): FeedbackResponseDto {
    return {
      id: feedback.id,
      rating: feedback.rating,
      comment: feedback.comment,
      status: feedback.status,
      createdAt: feedback.createdAt,
      updatedAt: feedback.updatedAt,
      user: feedback.user ? {
        id: feedback.user.id,
        firstName: feedback.user.firstName,
        lastName: feedback.user.lastName,
        email: feedback.user.email,
      } : undefined,
      book: feedback.book ? {
        id: feedback.book.id,
        title: feedback.book.title,
        author: feedback.book.author,
        isbn: feedback.book.isbn,
      } : undefined,
    };
  }
}
