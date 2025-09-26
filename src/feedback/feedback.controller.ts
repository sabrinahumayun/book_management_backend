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
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto, ModerateFeedbackDto, ListFeedbackQueryDto, FeedbackResponseDto, PaginatedFeedbackResponseDto } from './dto/feedback.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';

@Controller('feedback')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
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

  @Get()
  async findAll(@Query() queryDto: ListFeedbackQueryDto): Promise<PaginatedFeedbackResponseDto> {
    return this.feedbackService.findAll(queryDto, false);
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async findAllForAdmin(@Query() queryDto: ListFeedbackQueryDto): Promise<PaginatedFeedbackResponseDto> {
    return this.feedbackService.findAll(queryDto, true);
  }

  @Get('book/:bookId')
  async findByBook(
    @Param('bookId', ParseIntPipe) bookId: number,
    @Query() queryDto: ListFeedbackQueryDto
  ): Promise<PaginatedFeedbackResponseDto> {
    return this.feedbackService.findByBook(bookId, queryDto);
  }

  @Get(':id')
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

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
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
