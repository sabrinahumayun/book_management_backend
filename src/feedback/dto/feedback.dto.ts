import { IsString, IsNotEmpty, MinLength, MaxLength, IsOptional, IsInt, Min, Max, IsPositive, IsEnum } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FeedbackStatus } from '../entities/feedback.entity';

export class CreateFeedbackDto {
  @ApiProperty({ example: 4, description: 'Rating from 1 to 5 stars', minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ example: 'Great book! I really enjoyed reading it.', description: 'Feedback comment', minLength: 1, maxLength: 1000 })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(1000)
  comment: string;

  @ApiProperty({ example: 1, description: 'ID of the book to leave feedback for' })
  @IsInt()
  @IsPositive()
  bookId: number;
}

export class ModerateFeedbackDto {
  @ApiProperty({ enum: FeedbackStatus, example: FeedbackStatus.VISIBLE, description: 'Feedback status (visible or hidden)' })
  @IsEnum(FeedbackStatus)
  status: FeedbackStatus;
}

export class UpdateFeedbackDto {
  @ApiPropertyOptional({ example: 5, description: 'Updated rating from 1 to 5 stars', minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ example: 'Updated comment: This book is amazing!', description: 'Updated feedback comment', minLength: 1, maxLength: 1000 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(1000)
  comment?: string;
}

export class ListFeedbackQueryDto {
  @ApiPropertyOptional({ example: 1, description: 'Page number', minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, description: 'Number of feedbacks per page', minimum: 1, maximum: 100, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ example: 1, description: 'Filter by book ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  bookId?: number;

  @ApiPropertyOptional({ example: 1, description: 'Filter by user ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  userId?: number;

  @ApiPropertyOptional({ enum: FeedbackStatus, example: FeedbackStatus.VISIBLE, description: 'Filter by feedback status' })
  @IsOptional()
  @IsEnum(FeedbackStatus)
  status?: FeedbackStatus;
}

export class FeedbackResponseDto {
  @ApiProperty({ example: 1, description: 'Feedback ID' })
  id: number;

  @ApiProperty({ example: 4, description: 'Rating from 1 to 5 stars' })
  rating: number;

  @ApiProperty({ example: 'Great book! I really enjoyed reading it.', description: 'Feedback comment' })
  comment: string;

  @ApiProperty({ enum: FeedbackStatus, example: FeedbackStatus.VISIBLE, description: 'Feedback status' })
  status: FeedbackStatus;

  @ApiProperty({ example: '2023-01-01T00:00:00.000Z', description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ example: '2023-01-01T00:00:00.000Z', description: 'Last update date' })
  updatedAt: Date;

  @ApiPropertyOptional({
    example: {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com'
    },
    description: 'User information'
  })
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };

  @ApiPropertyOptional({
    example: {
      id: 1,
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      isbn: '978-0-7432-7356-5'
    },
    description: 'Book information'
  })
  book?: {
    id: number;
    title: string;
    author: string;
    isbn: string;
  };
}

export class PaginatedFeedbackResponseDto {
  @ApiProperty({ type: [FeedbackResponseDto], description: 'Array of feedbacks' })
  data: FeedbackResponseDto[];

  @ApiProperty({ example: 25, description: 'Total number of feedbacks' })
  total: number;

  @ApiProperty({ example: 1, description: 'Current page number' })
  page: number;

  @ApiProperty({ example: 10, description: 'Number of feedbacks per page' })
  limit: number;

  @ApiProperty({ example: 3, description: 'Total number of pages' })
  totalPages: number;
}
