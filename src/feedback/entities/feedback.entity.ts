import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User, UserRole } from '../../auth/entities/user.entity';
import { Book } from '../../books/entities/book.entity';

export enum FeedbackStatus {
  VISIBLE = 'visible',
  HIDDEN = 'hidden',
}
@Entity('feedbacks')
export class Feedback {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', default: 1 })
  rating: number;

  @Column({ type: 'text' })
  comment: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: FeedbackStatus.VISIBLE,
  })
  status: FeedbackStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.feedbacks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @ManyToOne(() => Book, (book) => book.feedbacks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bookId' })
  book: Book;

  @Column()
  bookId: number;

  constructor(partial: Partial<Feedback>) {
    Object.assign(this, partial);
  }
}
