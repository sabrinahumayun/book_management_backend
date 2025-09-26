import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, QueryFailedError } from 'typeorm';
import { Book } from './entities/book.entity';
import { CreateBookDto, UpdateBookDto, ListBooksQueryDto, PaginatedBooksResponseDto, BookResponseDto } from './dto/books.dto';

@Injectable()
export class BooksService {
  constructor(
    @InjectRepository(Book)
    private bookRepository: Repository<Book>,
  ) {}

  async create(createBookDto: CreateBookDto, userId: number): Promise<BookResponseDto> {
    try {
      const book = this.bookRepository.create({
        ...createBookDto,
        createdBy: userId,
      });
      const savedBook = await this.bookRepository.save(book);
      return this.mapToResponseDto(savedBook);
    } catch (error) {
      if (error instanceof QueryFailedError && error.message.includes('duplicate key')) {
        throw new ConflictException('A book with this ISBN already exists');
      }
      throw error;
    }
  }

  async findAll(queryDto: ListBooksQueryDto): Promise<PaginatedBooksResponseDto> {
    const { page = 1, limit = 10, title, author, isbn } = queryDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.bookRepository
      .createQueryBuilder('book')
      .leftJoinAndSelect('book.creator', 'creator');

    // Apply filters
    if (title) {
      queryBuilder.andWhere('LOWER(book.title) LIKE LOWER(:title)', { title: `%${title}%` });
    }
    if (author) {
      queryBuilder.andWhere('LOWER(book.author) LIKE LOWER(:author)', { author: `%${author}%` });
    }
    if (isbn) {
      queryBuilder.andWhere('book.isbn = :isbn', { isbn });
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination and ordering
    const books = await queryBuilder
      .orderBy('book.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getMany();

    const totalPages = Math.ceil(total / limit);

    return {
      data: books.map(book => this.mapToResponseDto(book)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findByUser(userId: number, queryDto: ListBooksQueryDto): Promise<PaginatedBooksResponseDto> {
    const { page = 1, limit = 10, title, author, isbn } = queryDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.bookRepository
      .createQueryBuilder('book')
      .leftJoinAndSelect('book.creator', 'creator')
      .where('book.createdBy = :userId', { userId });

    // Apply filters
    if (title) {
      queryBuilder.andWhere('LOWER(book.title) LIKE LOWER(:title)', { title: `%${title}%` });
    }
    if (author) {
      queryBuilder.andWhere('LOWER(book.author) LIKE LOWER(:author)', { author: `%${author}%` });
    }
    if (isbn) {
      queryBuilder.andWhere('book.isbn = :isbn', { isbn });
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination and ordering
    const books = await queryBuilder
      .orderBy('book.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getMany();

    const totalPages = Math.ceil(total / limit);

    return {
      data: books.map(book => this.mapToResponseDto(book)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findOne(id: number): Promise<BookResponseDto> {
    const book = await this.bookRepository.findOne({ 
      where: { id },
      relations: ['creator']
    });
    if (!book) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }
    return this.mapToResponseDto(book);
  }

  async update(id: number, updateBookDto: UpdateBookDto, userId: number, userRole: string): Promise<BookResponseDto> {
    const book = await this.bookRepository.findOne({ 
      where: { id },
      relations: ['creator']
    });
    if (!book) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }

    // Check if user can update this book (owner or admin)
    if (userRole !== 'admin' && book.createdBy !== userId) {
      throw new ForbiddenException('You can only update your own books');
    }

    try {
      // Check if ISBN is being updated and if it already exists
      if (updateBookDto.isbn && updateBookDto.isbn !== book.isbn) {
        const existingBook = await this.bookRepository.findOne({ 
          where: { isbn: updateBookDto.isbn } 
        });
        if (existingBook) {
          throw new ConflictException('A book with this ISBN already exists');
        }
      }

      Object.assign(book, updateBookDto);
      const updatedBook = await this.bookRepository.save(book);
      return this.mapToResponseDto(updatedBook);
    } catch (error) {
      if (error instanceof QueryFailedError && error.message.includes('duplicate key')) {
        throw new ConflictException('A book with this ISBN already exists');
      }
      throw error;
    }
  }

  async remove(id: number, userId: number, userRole: string): Promise<void> {
    const book = await this.bookRepository.findOne({ where: { id } });
    if (!book) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }

    // Check if user can delete this book (owner or admin)
    if (userRole !== 'admin' && book.createdBy !== userId) {
      throw new ForbiddenException('You can only delete your own books');
    }

    await this.bookRepository.remove(book);
  }

  private mapToResponseDto(book: Book): BookResponseDto {
    return {
      id: book.id,
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      createdAt: book.createdAt,
      updatedAt: book.updatedAt,
      createdBy: book.createdBy,
      creator: book.creator ? {
        id: book.creator.id,
        firstName: book.creator.firstName,
        lastName: book.creator.lastName,
        email: book.creator.email,
      } : undefined,
    };
  }
}
