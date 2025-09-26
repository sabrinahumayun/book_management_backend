import { IsString, IsNotEmpty, MinLength, MaxLength, IsOptional, IsISBN, IsInt, Min, Max, IsPositive } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookDto {
  @ApiProperty({ example: 'The Great Gatsby', description: 'Book title', minLength: 1, maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(255)
  title: string;

  @ApiProperty({ example: 'F. Scott Fitzgerald', description: 'Book author', minLength: 1, maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(255)
  author: string;

  @ApiProperty({ example: '978-0-7432-7356-5', description: 'Book ISBN (10-17 characters)', minLength: 10, maxLength: 17 })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(17)
  isbn: string;
}

export class UpdateBookDto {
  @ApiPropertyOptional({ example: 'The Great Gatsby', description: 'Book title', minLength: 1, maxLength: 255 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ example: 'F. Scott Fitzgerald', description: 'Book author', minLength: 1, maxLength: 255 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  author?: string;

  @ApiPropertyOptional({ example: '978-0-7432-7356-5', description: 'Book ISBN (10-17 characters)', minLength: 10, maxLength: 17 })
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(17)
  isbn?: string;
}

export class ListBooksQueryDto {
  @ApiPropertyOptional({ example: 1, description: 'Page number', minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, description: 'Number of books per page', minimum: 1, maximum: 100, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ example: 'Gatsby', description: 'Filter by book title' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  title?: string;

  @ApiPropertyOptional({ example: 'Fitzgerald', description: 'Filter by author name' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  author?: string;

  @ApiPropertyOptional({ example: '978-0-7432-7356-5', description: 'Filter by ISBN' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  isbn?: string;
}

export class BookResponseDto {
  @ApiProperty({ example: 1, description: 'Book ID' })
  id: number;

  @ApiProperty({ example: 'The Great Gatsby', description: 'Book title' })
  title: string;

  @ApiProperty({ example: 'F. Scott Fitzgerald', description: 'Book author' })
  author: string;

  @ApiProperty({ example: '978-0-7432-7356-5', description: 'Book ISBN' })
  isbn: string;

  @ApiProperty({ example: '2023-01-01T00:00:00.000Z', description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ example: '2023-01-01T00:00:00.000Z', description: 'Last update date' })
  updatedAt: Date;

  @ApiPropertyOptional({ example: 1, description: 'ID of the user who created the book' })
  createdBy?: number;

  @ApiPropertyOptional({
    example: {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com'
    },
    description: 'Creator information'
  })
  creator?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export class PaginatedBooksResponseDto {
  @ApiProperty({ type: [BookResponseDto], description: 'Array of books' })
  data: BookResponseDto[];

  @ApiProperty({ example: 25, description: 'Total number of books' })
  total: number;

  @ApiProperty({ example: 1, description: 'Current page number' })
  page: number;

  @ApiProperty({ example: 10, description: 'Number of books per page' })
  limit: number;

  @ApiProperty({ example: 3, description: 'Total number of pages' })
  totalPages: number;
}
