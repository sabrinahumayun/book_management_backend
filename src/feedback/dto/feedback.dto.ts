import { IsString, IsNotEmpty, MinLength, MaxLength, IsOptional, IsInt, Min, Max, IsPositive, IsEnum } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { FeedbackStatus } from '../entities/feedback.entity';

export class CreateFeedbackDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(1000)
  comment: string;

  @IsInt()
  @IsPositive()
  bookId: number;
}

export class ModerateFeedbackDto {
  @IsEnum(FeedbackStatus)
  status: FeedbackStatus;
}

export class ListFeedbackQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  bookId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  userId?: number;

  @IsOptional()
  @IsEnum(FeedbackStatus)
  status?: FeedbackStatus;
}

export class FeedbackResponseDto {
  id: number;
  rating: number;
  comment: string;
  status: FeedbackStatus;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  book: {
    id: number;
    title: string;
    author: string;
    isbn: string;
  };
}

export class PaginatedFeedbackResponseDto {
  data: FeedbackResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
