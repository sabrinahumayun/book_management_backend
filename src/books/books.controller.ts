import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query, 
  UseGuards, 
  Request,
  ParseIntPipe,
  ValidationPipe,
  UsePipes
} from '@nestjs/common';
import { BooksService } from './books.service';
import { CreateBookDto, UpdateBookDto, ListBooksQueryDto, BookResponseDto, PaginatedBooksResponseDto } from './dto/books.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';

@Controller('books')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.USER) // Both admin and user can create books
  async create(
    @Body() createBookDto: CreateBookDto,
    @Request() req: any
  ): Promise<{ message: string; book: BookResponseDto }> {
    const book = await this.booksService.create(createBookDto, req.user.id);
    return {
      message: 'Book created successfully',
      book,
    };
  }

  @Get()
  async findAll(@Query() queryDto: ListBooksQueryDto): Promise<PaginatedBooksResponseDto> {
    return this.booksService.findAll(queryDto);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<BookResponseDto> {
    return this.booksService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN) // Only admin can update books
  async update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateBookDto: UpdateBookDto
  ): Promise<{ message: string; book: BookResponseDto }> {
    const book = await this.booksService.update(id, updateBookDto);
    return {
      message: 'Book updated successfully',
      book,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN) // Only admin can delete books
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    await this.booksService.remove(id);
    return {
      message: 'Book deleted successfully',
    };
  }
}
