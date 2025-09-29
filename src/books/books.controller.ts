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
  ParseIntPipe
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BooksService } from './books.service';
import { CreateBookDto, UpdateBookDto, ListBooksQueryDto, BookResponseDto, PaginatedBooksResponseDto, BulkDeleteBooksDto } from './dto/books.dto';
import { BulkDeleteResponseDto } from '../auth/dto/auth.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';

@ApiTags('Books')
@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.USER) // Both admin and user can create books
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new book' })
  @ApiResponse({ status: 201, description: 'Book created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Book with this ISBN already exists' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
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
  @ApiOperation({ summary: 'Get all books with pagination and filtering' })
  @ApiResponse({ status: 200, description: 'Books retrieved successfully', type: PaginatedBooksResponseDto })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of books per page' })
  @ApiQuery({ name: 'title', required: false, type: String, description: 'Filter by title' })
  @ApiQuery({ name: 'author', required: false, type: String, description: 'Filter by author' })
  @ApiQuery({ name: 'isbn', required: false, type: String, description: 'Filter by ISBN' })
  async findAll(@Query() queryDto: ListBooksQueryDto): Promise<PaginatedBooksResponseDto> {
    return this.booksService.findAll(queryDto);
  }

  @Get('my-books')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user\'s books' })
  @ApiResponse({ status: 200, description: 'User books retrieved successfully', type: PaginatedBooksResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of books per page' })
  @ApiQuery({ name: 'title', required: false, type: String, description: 'Filter by title' })
  @ApiQuery({ name: 'author', required: false, type: String, description: 'Filter by author' })
  @ApiQuery({ name: 'isbn', required: false, type: String, description: 'Filter by ISBN' })
  async findMyBooks(
    @Request() req: any,
    @Query() queryDto: ListBooksQueryDto
  ): Promise<PaginatedBooksResponseDto> {
    return this.booksService.findByUser(req.user.id, queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a book by ID' })
  @ApiResponse({ status: 200, description: 'Book retrieved successfully', type: BookResponseDto })
  @ApiResponse({ status: 404, description: 'Book not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<BookResponseDto> {
    return this.booksService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a book' })
  @ApiResponse({ status: 200, description: 'Book updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - You can only update your own books' })
  @ApiResponse({ status: 404, description: 'Book not found' })
  @ApiResponse({ status: 409, description: 'Book with this ISBN already exists' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateBookDto: UpdateBookDto,
    @Request() req: any
  ): Promise<{ message: string; book: BookResponseDto }> {
    const book = await this.booksService.update(id, updateBookDto, req.user.id, req.user.role);
    return {
      message: 'Book updated successfully',
      book,
    };
  }

  @Delete('bulk')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Bulk delete books' })
  @ApiResponse({ status: 200, description: 'Bulk delete operation completed', type: BulkDeleteResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async bulkDeleteBooks(
    @Body() bulkDeleteDto: BulkDeleteBooksDto,
    @Request() req: any
  ): Promise<BulkDeleteResponseDto> {
    return this.booksService.bulkDeleteBooks(bulkDeleteDto, req.user.id, req.user.role);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a book' })
  @ApiResponse({ status: 200, description: 'Book deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - You can only delete your own books' })
  @ApiResponse({ status: 404, description: 'Book not found' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any
  ): Promise<{ message: string }> {
    await this.booksService.remove(id, req.user.id, req.user.role);
    return {
      message: 'Book deleted successfully',
    };
  }
}
