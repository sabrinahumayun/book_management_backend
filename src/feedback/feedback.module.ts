import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeedbackService } from './feedback.service';
import { FeedbackController } from './feedback.controller';
import { Feedback } from './entities/feedback.entity';
import { User } from '../auth/entities/user.entity';
import { Book } from '../books/entities/book.entity';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Feedback, User, Book])],
  controllers: [FeedbackController],
  providers: [FeedbackService, RolesGuard],
  exports: [FeedbackService],
})
export class FeedbackModule {}
