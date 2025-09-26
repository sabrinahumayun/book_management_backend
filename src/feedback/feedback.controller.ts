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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto, ModerateFeedbackDto, UpdateFeedbackDto, ListFeedbackQueryDto, FeedbackResponseDto, PaginatedFeedbackResponseDto } from './dto/feedback.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { FeedbackThrottlerGuard } from './feedback-throttler.guard';

@ApiTags('Feedback')
@Controller('feedback')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @UseGuards(JwtAuthGuard, FeedbackThrottlerGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create feedback for a book (Rate limited: 1 per minute per user)' })
  @ApiResponse({ status: 201, description: 'Feedback created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Book not found' })
  @ApiResponse({ status: 429, description: 'Too Many Requests - Rate limit exceeded (1 feedback per minute per user)' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(
    @Body() createFeedbackDto: CreateFeedbackDto,
    @Request() req: any
  ): Promise<{ message: string; feedback: FeedbackResponseDto }> {
    const feedback = await this.feedbackService.create(createFeedbackDto, req.user.id);
    return {
      message: 'Feedback created successfully',
      feedback,
    };
  }

  @Get('all-reviews')
  @ApiOperation({ summary: 'Get all visible reviews with pagination and filtering' })
  @ApiResponse({ status: 200, description: 'Reviews retrieved successfully', type: PaginatedFeedbackResponseDto })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of reviews per page' })
  @ApiQuery({ name: 'bookId', required: false, type: Number, description: 'Filter by book ID' })
  @ApiQuery({ name: 'userId', required: false, type: Number, description: 'Filter by user ID' })
  @ApiQuery({ name: 'status', required: false, enum: ['visible', 'hidden'], description: 'Filter by status' })
  async findAll(@Query() queryDto: ListFeedbackQueryDto): Promise<PaginatedFeedbackResponseDto> {
    return this.feedbackService.findAll(queryDto, false);
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all feedbacks for admin (including hidden ones)' })
  @ApiResponse({ status: 200, description: 'Feedbacks retrieved successfully', type: PaginatedFeedbackResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of feedbacks per page' })
  @ApiQuery({ name: 'bookId', required: false, type: Number, description: 'Filter by book ID' })
  @ApiQuery({ name: 'userId', required: false, type: Number, description: 'Filter by user ID' })
  @ApiQuery({ name: 'status', required: false, enum: ['visible', 'hidden'], description: 'Filter by status' })
  async findAllForAdmin(@Query() queryDto: ListFeedbackQueryDto): Promise<PaginatedFeedbackResponseDto> {
    return this.feedbackService.findAll(queryDto, true);
  }

  @Get('my-reviews')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user\'s reviews' })
  @ApiResponse({ status: 200, description: 'User reviews retrieved successfully', type: PaginatedFeedbackResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of reviews per page' })
  @ApiQuery({ name: 'bookId', required: false, type: Number, description: 'Filter by book ID' })
  @ApiQuery({ name: 'status', required: false, enum: ['visible', 'hidden'], description: 'Filter by status' })
  async findMyReviews(
    @Request() req: any,
    @Query() queryDto: ListFeedbackQueryDto
  ): Promise<PaginatedFeedbackResponseDto> {
    // Set the userId to current user's ID
    queryDto.userId = req.user.id;
    return this.feedbackService.findAll(queryDto, false);
  }

  @Get('book/:bookId')
  @ApiOperation({ summary: 'Get feedbacks for a specific book' })
  @ApiResponse({ status: 200, description: 'Feedbacks retrieved successfully', type: PaginatedFeedbackResponseDto })
  @ApiResponse({ status: 404, description: 'Book not found' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of feedbacks per page' })
  @ApiQuery({ name: 'userId', required: false, type: Number, description: 'Filter by user ID' })
  @ApiQuery({ name: 'status', required: false, enum: ['visible', 'hidden'], description: 'Filter by status' })
  async findByBook(
    @Param('bookId', ParseIntPipe) bookId: number,
    @Query() queryDto: ListFeedbackQueryDto
  ): Promise<PaginatedFeedbackResponseDto> {
    return this.feedbackService.findByBook(bookId, queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get feedback by ID' })
  @ApiResponse({ status: 200, description: 'Feedback retrieved successfully', type: FeedbackResponseDto })
  @ApiResponse({ status: 404, description: 'Feedback not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - You can only view your own feedbacks' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any
  ): Promise<FeedbackResponseDto> {
    const isAdmin = req.user?.role === UserRole.ADMIN;
    return this.feedbackService.findOne(id, req.user?.id || 0, isAdmin);
  }

  @Patch(':id/moderate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Moderate feedback (Admin only)' })
  @ApiResponse({ status: 200, description: 'Feedback moderated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Feedback not found' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async moderate(
    @Param('id', ParseIntPipe) id: number,
    @Body() moderateFeedbackDto: ModerateFeedbackDto
  ): Promise<{ message: string; feedback: FeedbackResponseDto }> {
    const feedback = await this.feedbackService.moderate(id, moderateFeedbackDto);
    return {
      message: 'Feedback moderated successfully',
      feedback,
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update feedback' })
  @ApiResponse({ status: 200, description: 'Feedback updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - You can only update your own feedback' })
  @ApiResponse({ status: 404, description: 'Feedback not found' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFeedbackDto: UpdateFeedbackDto,
    @Request() req: any
  ): Promise<{ message: string; feedback: FeedbackResponseDto }> {
    const isAdmin = req.user?.role === UserRole.ADMIN;
    const feedback = await this.feedbackService.update(id, updateFeedbackDto, req.user.id, isAdmin);
    return {
      message: 'Feedback updated successfully',
      feedback,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete feedback' })
  @ApiResponse({ status: 200, description: 'Feedback deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - You can only delete your own feedbacks' })
  @ApiResponse({ status: 404, description: 'Feedback not found' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any
  ): Promise<{ message: string }> {
    const isAdmin = req.user?.role === UserRole.ADMIN;
    await this.feedbackService.remove(id, req.user.id, isAdmin);
    return {
      message: 'Feedback deleted successfully',
    };
  }
}
