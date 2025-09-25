import { IsString, IsNotEmpty, MinLength, MaxLength, IsOptional, IsISBN, IsInt, Min, Max, IsPositive } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateBookDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(255)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(255)
  author: string;

  @IsString()
  @IsNotEmpty()
  @IsISBN()
  isbn: string;
}

export class UpdateBookDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  author?: string;

  @IsOptional()
  @IsString()
  @IsISBN()
  isbn?: string;
}

export class ListBooksQueryDto {
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
  @IsString()
  @Transform(({ value }) => value?.trim())
  title?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  author?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  isbn?: string;
}

export class BookResponseDto {
  id: number;
  title: string;
  author: string;
  isbn: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: number;
  creator?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export class PaginatedBooksResponseDto {
  data: BookResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
