import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../src/auth/entities/user.entity';
import { Book } from '../src/books/entities/book.entity';
import { Feedback, FeedbackStatus } from '../src/feedback/entities/feedback.entity';
import * as bcrypt from 'bcryptjs';

interface SeedData {
  users: Partial<User>[];
  books: Partial<Book>[];
  feedbacks: Partial<Feedback>[];
}

const seedData: SeedData = {
  users: [
    // Admin Users
    {
      email: 'admin@bookportal.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      isActive: true,
    },
    {
      email: 'superadmin@bookportal.com',
      password: 'admin123',
      firstName: 'Super',
      lastName: 'Admin',
      role: UserRole.ADMIN,
      isActive: true,
    },
    
    // Regular Users - Literature Enthusiasts
    {
      email: 'john.doe@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.USER,
      isActive: true,
    },
    {
      email: 'jane.smith@example.com',
      password: 'password123',
      firstName: 'Jane',
      lastName: 'Smith',
      role: UserRole.USER,
      isActive: true,
    },
    {
      email: 'mike.johnson@example.com',
      password: 'password123',
      firstName: 'Mike',
      lastName: 'Johnson',
      role: UserRole.USER,
      isActive: true,
    },
    {
      email: 'sarah.wilson@example.com',
      password: 'password123',
      firstName: 'Sarah',
      lastName: 'Wilson',
      role: UserRole.USER,
      isActive: true,
    },
    {
      email: 'david.brown@example.com',
      password: 'password123',
      firstName: 'David',
      lastName: 'Brown',
      role: UserRole.USER,
      isActive: true,
    },
    
    // Additional Users
    {
      email: 'emma.davis@example.com',
      password: 'password123',
      firstName: 'Emma',
      lastName: 'Davis',
      role: UserRole.USER,
      isActive: true,
    },
    {
      email: 'alex.martinez@example.com',
      password: 'password123',
      firstName: 'Alex',
      lastName: 'Martinez',
      role: UserRole.USER,
      isActive: true,
    },
    {
      email: 'lisa.anderson@example.com',
      password: 'password123',
      firstName: 'Lisa',
      lastName: 'Anderson',
      role: UserRole.USER,
      isActive: true,
    },
    {
      email: 'robert.taylor@example.com',
      password: 'password123',
      firstName: 'Robert',
      lastName: 'Taylor',
      role: UserRole.USER,
      isActive: true,
    },
    {
      email: 'maria.garcia@example.com',
      password: 'password123',
      firstName: 'Maria',
      lastName: 'Garcia',
      role: UserRole.USER,
      isActive: true,
    },
    {
      email: 'james.wilson@example.com',
      password: 'password123',
      firstName: 'James',
      lastName: 'Wilson',
      role: UserRole.USER,
      isActive: true,
    },
    {
      email: 'jennifer.thomas@example.com',
      password: 'password123',
      firstName: 'Jennifer',
      lastName: 'Thomas',
      role: UserRole.USER,
      isActive: true,
    },
    {
      email: 'william.moore@example.com',
      password: 'password123',
      firstName: 'William',
      lastName: 'Moore',
      role: UserRole.USER,
      isActive: true,
    },
    {
      email: 'linda.jackson@example.com',
      password: 'password123',
      firstName: 'Linda',
      lastName: 'Jackson',
      role: UserRole.USER,
      isActive: true,
    },
    {
      email: 'charles.white@example.com',
      password: 'password123',
      firstName: 'Charles',
      lastName: 'White',
      role: UserRole.USER,
      isActive: true,
    },
    
    // Suspended Users
    {
      email: 'suspended@example.com',
      password: 'password123',
      firstName: 'Suspended',
      lastName: 'User',
      role: UserRole.USER,
      isActive: false,
    },
    {
      email: 'banned.user@example.com',
      password: 'password123',
      firstName: 'Banned',
      lastName: 'User',
      role: UserRole.USER,
      isActive: false,
    },
  ],
  books: [
    // Classic Literature
    {
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      isbn: '978-0-7432-7356-5',
      createdBy: 1, // Admin
    },
    {
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      isbn: '978-0-06-112008-4',
      createdBy: 2, // John Doe
    },
    {
      title: '1984',
      author: 'George Orwell',
      isbn: '978-0-452-28423-4',
      createdBy: 2, // John Doe
    },
    {
      title: 'Pride and Prejudice',
      author: 'Jane Austen',
      isbn: '978-0-14-143951-8',
      createdBy: 3, // Jane Smith
    },
    {
      title: 'The Catcher in the Rye',
      author: 'J.D. Salinger',
      isbn: '978-0-316-76948-0',
      createdBy: 3, // Jane Smith
    },
    {
      title: 'Lord of the Flies',
      author: 'William Golding',
      isbn: '978-0-571-05686-5',
      createdBy: 4, // Mike Johnson
    },
    {
      title: 'Wuthering Heights',
      author: 'Emily Brontë',
      isbn: '978-0-14-143955-6',
      createdBy: 5, // Sarah Wilson
    },
    {
      title: 'Jane Eyre',
      author: 'Charlotte Brontë',
      isbn: '978-0-14-144114-6',
      createdBy: 6, // David Brown
    },
    {
      title: 'Moby Dick',
      author: 'Herman Melville',
      isbn: '978-0-14-243724-7',
      createdBy: 7, // Emma Davis
    },
    {
      title: 'The Scarlet Letter',
      author: 'Nathaniel Hawthorne',
      isbn: '978-0-14-243726-1',
      createdBy: 8, // Alex Martinez
    },
    
    // Fantasy & Science Fiction
    {
      title: 'The Hobbit',
      author: 'J.R.R. Tolkien',
      isbn: '978-0-547-92822-7',
      createdBy: 4, // Mike Johnson
    },
    {
      title: 'The Lord of the Rings: The Fellowship of the Ring',
      author: 'J.R.R. Tolkien',
      isbn: '978-0-547-92823-4',
      createdBy: 1, // Admin
    },
    {
      title: 'Harry Potter and the Philosopher\'s Stone',
      author: 'J.K. Rowling',
      isbn: '978-0-7475-3269-9',
      createdBy: 5, // Sarah Wilson
    },
    {
      title: 'Harry Potter and the Chamber of Secrets',
      author: 'J.K. Rowling',
      isbn: '978-0-7475-3849-3',
      createdBy: 6, // David Brown
    },
    {
      title: 'The Chronicles of Narnia: The Lion, the Witch and the Wardrobe',
      author: 'C.S. Lewis',
      isbn: '978-0-06-447119-0',
      createdBy: 5, // Sarah Wilson
    },
    {
      title: 'Dune',
      author: 'Frank Herbert',
      isbn: '978-0-441-17271-9',
      createdBy: 7, // Emma Davis
    },
    {
      title: 'Foundation',
      author: 'Isaac Asimov',
      isbn: '978-0-553-29335-0',
      createdBy: 8, // Alex Martinez
    },
    {
      title: 'The Hitchhiker\'s Guide to the Galaxy',
      author: 'Douglas Adams',
      isbn: '978-0-345-39180-3',
      createdBy: 9, // Lisa Anderson
    },
    
    // Modern Fiction
    {
      title: 'The Alchemist',
      author: 'Paulo Coelho',
      isbn: '978-0-06-112241-5',
      createdBy: 6, // David Brown
    },
    {
      title: 'The Da Vinci Code',
      author: 'Dan Brown',
      isbn: '978-0-307-26520-1',
      createdBy: 6, // David Brown
    },
    {
      title: 'The Kite Runner',
      author: 'Khaled Hosseini',
      isbn: '978-1-59448-000-3',
      createdBy: 1, // Admin
    },
    {
      title: 'A Thousand Splendid Suns',
      author: 'Khaled Hosseini',
      isbn: '978-1-59448-950-1',
      createdBy: 2, // John Doe
    },
    {
      title: 'The Book Thief',
      author: 'Markus Zusak',
      isbn: '978-0-375-84220-7',
      createdBy: 3, // Jane Smith
    },
    {
      title: 'Life of Pi',
      author: 'Yann Martel',
      isbn: '978-0-15-602732-8',
      createdBy: 4, // Mike Johnson
    },
    {
      title: 'The Curious Incident of the Dog in the Night-Time',
      author: 'Mark Haddon',
      isbn: '978-0-09-945025-2',
      createdBy: 5, // Sarah Wilson
    },
    {
      title: 'The Help',
      author: 'Kathryn Stockett',
      isbn: '978-0-399-15534-5',
      createdBy: 6, // David Brown
    },
    
    // Mystery & Thriller
    {
      title: 'Gone Girl',
      author: 'Gillian Flynn',
      isbn: '978-0-307-58836-4',
      createdBy: 7, // Emma Davis
    },
    {
      title: 'The Girl with the Dragon Tattoo',
      author: 'Stieg Larsson',
      isbn: '978-0-307-26975-1',
      createdBy: 8, // Alex Martinez
    },
    {
      title: 'The Silence of the Lambs',
      author: 'Thomas Harris',
      isbn: '978-0-312-92486-2',
      createdBy: 9, // Lisa Anderson
    },
    {
      title: 'The Big Sleep',
      author: 'Raymond Chandler',
      isbn: '978-0-394-75828-0',
      createdBy: 10, // Robert Taylor
    },
    
    // Romance
    {
      title: 'The Notebook',
      author: 'Nicholas Sparks',
      isbn: '978-0-446-60523-6',
      createdBy: 11, // Maria Garcia
    },
    {
      title: 'Me Before You',
      author: 'Jojo Moyes',
      isbn: '978-0-670-02663-0',
      createdBy: 12, // James Wilson
    },
    {
      title: 'The Time Traveler\'s Wife',
      author: 'Audrey Niffenegger',
      isbn: '978-0-15-602943-8',
      createdBy: 13, // Jennifer Thomas
    },
    
    // Biography & Memoir
    {
      title: 'Becoming',
      author: 'Michelle Obama',
      isbn: '978-1-5247-6313-8',
      createdBy: 14, // William Moore
    },
    {
      title: 'Educated',
      author: 'Tara Westover',
      isbn: '978-0-399-59050-4',
      createdBy: 15, // Linda Jackson
    },
    {
      title: 'Born a Crime',
      author: 'Trevor Noah',
      isbn: '978-0-399-58803-7',
      createdBy: 16, // Charles White
    },
    
    // Self-Help & Business
    {
      title: 'Atomic Habits',
      author: 'James Clear',
      isbn: '978-0-7352-1129-2',
      createdBy: 1, // Admin
    },
    {
      title: 'Thinking, Fast and Slow',
      author: 'Daniel Kahneman',
      isbn: '978-0-374-53355-7',
      createdBy: 2, // John Doe
    },
    {
      title: 'The Lean Startup',
      author: 'Eric Ries',
      isbn: '978-0-307-88789-4',
      createdBy: 3, // Jane Smith
    },
    {
      title: 'Good to Great',
      author: 'Jim Collins',
      isbn: '978-0-06-662099-2',
      createdBy: 4, // Mike Johnson
    },
    
    // Poetry
    {
      title: 'The Collected Poems of Emily Dickinson',
      author: 'Emily Dickinson',
      isbn: '978-0-679-60195-8',
      createdBy: 5, // Sarah Wilson
    },
    {
      title: 'Leaves of Grass',
      author: 'Walt Whitman',
      isbn: '978-0-14-042199-5',
      createdBy: 6, // David Brown
    },
    
    // Children's Books
    {
      title: 'Where the Wild Things Are',
      author: 'Maurice Sendak',
      isbn: '978-0-06-443178-1',
      createdBy: 7, // Emma Davis
    },
    {
      title: 'The Very Hungry Caterpillar',
      author: 'Eric Carle',
      isbn: '978-0-399-22690-8',
      createdBy: 8, // Alex Martinez
    },
    {
      title: 'Charlotte\'s Web',
      author: 'E.B. White',
      isbn: '978-0-06-440055-8',
      createdBy: 9, // Lisa Anderson
    },
    
    // Philosophy & Religion
    {
      title: 'Meditations',
      author: 'Marcus Aurelius',
      isbn: '978-0-14-044933-4',
      createdBy: 10, // Robert Taylor
    },
    {
      title: 'The Art of War',
      author: 'Sun Tzu',
      isbn: '978-1-59030-963-7',
      createdBy: 11, // Maria Garcia
    },
    {
      title: 'The Power of Now',
      author: 'Eckhart Tolle',
      isbn: '978-1-57731-480-9',
      createdBy: 12, // James Wilson
    },
  ],
  feedbacks: [
    // Feedback for The Great Gatsby
    {
      rating: 5,
      comment: 'An absolute masterpiece! Fitzgerald\'s writing is beautiful and the story is timeless.',
      status: FeedbackStatus.VISIBLE,
      userId: 2, // John Doe
      bookId: 1,
    },
    {
      rating: 4,
      comment: 'Great book, though a bit slow at times. The characters are well-developed.',
      status: FeedbackStatus.VISIBLE,
      userId: 3, // Jane Smith
      bookId: 1,
    },
    {
      rating: 3,
      comment: 'Classic literature but not my cup of tea. Still worth reading.',
      status: FeedbackStatus.VISIBLE,
      userId: 4, // Mike Johnson
      bookId: 1,
    },
    
    // Feedback for To Kill a Mockingbird
    {
      rating: 5,
      comment: 'One of the most important books ever written. A must-read for everyone.',
      status: FeedbackStatus.VISIBLE,
      userId: 1, // Admin
      bookId: 2,
    },
    {
      rating: 5,
      comment: 'Powerful and moving. Harper Lee\'s storytelling is incredible.',
      status: FeedbackStatus.VISIBLE,
      userId: 3, // Jane Smith
      bookId: 2,
    },
    {
      rating: 4,
      comment: 'Great book about justice and morality. Highly recommended.',
      status: FeedbackStatus.VISIBLE,
      userId: 5, // Sarah Wilson
      bookId: 2,
    },
    
    // Feedback for 1984
    {
      rating: 5,
      comment: 'Disturbingly relevant even today. Orwell was a visionary.',
      status: FeedbackStatus.VISIBLE,
      userId: 1, // Admin
      bookId: 3,
    },
    {
      rating: 4,
      comment: 'Thought-provoking dystopian novel. Makes you think about society.',
      status: FeedbackStatus.VISIBLE,
      userId: 4, // Mike Johnson
      bookId: 3,
    },
    {
      rating: 2,
      comment: 'Too depressing for my taste. Well-written but not enjoyable.',
      status: FeedbackStatus.HIDDEN, // Hidden by admin
      userId: 6, // David Brown
      bookId: 3,
    },
    
    // Feedback for Pride and Prejudice
    {
      rating: 5,
      comment: 'Jane Austen at her finest! Elizabeth Bennet is one of my favorite characters.',
      status: FeedbackStatus.VISIBLE,
      userId: 2, // John Doe
      bookId: 4,
    },
    {
      rating: 4,
      comment: 'Classic romance with witty dialogue. A delightful read.',
      status: FeedbackStatus.VISIBLE,
      userId: 5, // Sarah Wilson
      bookId: 4,
    },
    
    // Feedback for The Catcher in the Rye
    {
      rating: 3,
      comment: 'Interesting perspective on teenage angst, but Holden can be annoying.',
      status: FeedbackStatus.VISIBLE,
      userId: 1, // Admin
      bookId: 5,
    },
    {
      rating: 4,
      comment: 'Relatable coming-of-age story. Salinger captures teenage voice well.',
      status: FeedbackStatus.VISIBLE,
      userId: 4, // Mike Johnson
      bookId: 5,
    },
    
    // Feedback for Lord of the Flies
    {
      rating: 4,
      comment: 'Dark and thought-provoking. Shows the thin line between civilization and savagery.',
      status: FeedbackStatus.VISIBLE,
      userId: 2, // John Doe
      bookId: 6,
    },
    {
      rating: 3,
      comment: 'Good book but quite disturbing. Not for the faint of heart.',
      status: FeedbackStatus.VISIBLE,
      userId: 3, // Jane Smith
      bookId: 6,
    },
    
    // Feedback for The Hobbit
    {
      rating: 5,
      comment: 'Fantasy adventure at its best! Tolkien\'s world-building is incredible.',
      status: FeedbackStatus.VISIBLE,
      userId: 1, // Admin
      bookId: 7,
    },
    {
      rating: 5,
      comment: 'Perfect introduction to Middle-earth. Bilbo\'s journey is magical.',
      status: FeedbackStatus.VISIBLE,
      userId: 5, // Sarah Wilson
      bookId: 7,
    },
    {
      rating: 4,
      comment: 'Great fantasy novel. The characters are memorable and the story is engaging.',
      status: FeedbackStatus.VISIBLE,
      userId: 6, // David Brown
      bookId: 7,
    },
    
    // Feedback for Harry Potter
    {
      rating: 5,
      comment: 'Magical and enchanting! J.K. Rowling created an amazing world.',
      status: FeedbackStatus.VISIBLE,
      userId: 2, // John Doe
      bookId: 8,
    },
    {
      rating: 5,
      comment: 'The book that got me into reading. Absolutely love the wizarding world!',
      status: FeedbackStatus.VISIBLE,
      userId: 4, // Mike Johnson
      bookId: 8,
    },
    {
      rating: 4,
      comment: 'Great children\'s book that adults can enjoy too. Well-written and imaginative.',
      status: FeedbackStatus.VISIBLE,
      userId: 6, // David Brown
      bookId: 8,
    },
    
    // Feedback for The Chronicles of Narnia
    {
      rating: 4,
      comment: 'Classic fantasy series. Aslan is such a powerful character.',
      status: FeedbackStatus.VISIBLE,
      userId: 1, // Admin
      bookId: 9,
    },
    {
      rating: 5,
      comment: 'Childhood favorite! The Christian allegory adds depth to the story.',
      status: FeedbackStatus.VISIBLE,
      userId: 3, // Jane Smith
      bookId: 9,
    },
    
    // Feedback for The Alchemist
    {
      rating: 4,
      comment: 'Inspiring and philosophical. Coelho\'s writing is simple yet profound.',
      status: FeedbackStatus.VISIBLE,
      userId: 2, // John Doe
      bookId: 10,
    },
    {
      rating: 3,
      comment: 'Good motivational book, though a bit repetitive at times.',
      status: FeedbackStatus.VISIBLE,
      userId: 4, // Mike Johnson
      bookId: 10,
    },
    
    // Feedback for The Da Vinci Code
    {
      rating: 3,
      comment: 'Entertaining thriller with interesting historical elements.',
      status: FeedbackStatus.VISIBLE,
      userId: 1, // Admin
      bookId: 11,
    },
    {
      rating: 4,
      comment: 'Fast-paced and engaging. Good beach read.',
      status: FeedbackStatus.VISIBLE,
      userId: 5, // Sarah Wilson
      bookId: 11,
    },
    
    // Feedback for The Kite Runner
    {
      rating: 5,
      comment: 'Heartbreaking and beautiful. Hosseini\'s storytelling is masterful.',
      status: FeedbackStatus.VISIBLE,
      userId: 3, // Jane Smith
      bookId: 12,
    },
    {
      rating: 5,
      comment: 'Powerful story about friendship and redemption. Highly emotional read.',
      status: FeedbackStatus.VISIBLE,
      userId: 6, // David Brown
      bookId: 12,
    },
  ],
};

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const userRepository = app.get<Repository<User>>(getRepositoryToken(User));
  const bookRepository = app.get<Repository<Book>>(getRepositoryToken(Book));
  const feedbackRepository = app.get<Repository<Feedback>>(getRepositoryToken(Feedback));
  
  try {
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    
    // Use query builder to clear all data
    await feedbackRepository.createQueryBuilder().delete().execute();
    await bookRepository.createQueryBuilder().delete().execute();
    await userRepository.createQueryBuilder().delete().execute();
    
    // Seed users
    console.log('👥 Seeding users...');
    const hashedUsers = await Promise.all(
      seedData.users.map(async (user) => ({
        ...user,
        password: await bcrypt.hash(user.password!, 12),
      }))
    );
    
    const createdUsers = await userRepository.save(hashedUsers);
    console.log(`✅ Created ${createdUsers.length} users`);
    
    // Seed books with correct user IDs
    console.log('📚 Seeding books...');
    const booksWithCorrectUserIds = seedData.books.map(book => ({
      ...book,
      createdBy: createdUsers[book.createdBy! - 1].id, // Map to actual user IDs
    }));
    
    const createdBooks = await bookRepository.save(booksWithCorrectUserIds);
    console.log(`✅ Created ${createdBooks.length} books`);
    
    // Seed feedbacks with correct user and book IDs
    console.log('💬 Seeding feedbacks...');
    const feedbacksWithCorrectIds = seedData.feedbacks.map(feedback => ({
      ...feedback,
      userId: createdUsers[feedback.userId! - 1].id, // Map to actual user IDs
      bookId: createdBooks[feedback.bookId! - 1].id, // Map to actual book IDs
    }));
    
    const createdFeedbacks = await feedbackRepository.save(feedbacksWithCorrectIds);
    console.log(`✅ Created ${createdFeedbacks.length} feedbacks`);
    
    // Display summary
    console.log('\n📊 Seeding Summary:');
    console.log('==================');
    console.log(`👥 Users: ${createdUsers.length}`);
    console.log(`📚 Books: ${createdBooks.length}`);
    console.log(`💬 Feedbacks: ${createdFeedbacks.length}`);
    
    // Display user credentials
    console.log('\n🔑 Test User Credentials:');
    console.log('========================');
    console.log('Admin User:');
    console.log('  Email: admin@bookportal.com');
    console.log('  Password: admin123');
    console.log('  Role: ADMIN');
    console.log('');
    console.log('Regular Users:');
    console.log('  Email: john.doe@example.com | Password: password123');
    console.log('  Email: jane.smith@example.com | Password: password123');
    console.log('  Email: mike.johnson@example.com | Password: password123');
    console.log('  Email: sarah.wilson@example.com | Password: password123');
    console.log('  Email: david.brown@example.com | Password: password123');
    console.log('');
    console.log('Suspended User:');
    console.log('  Email: suspended@example.com | Password: password123 (Account suspended)');
    
    console.log('\n🎉 Database seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await app.close();
  }
}

// Run the seeding function
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('✅ Seeding process finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding process failed:', error);
      process.exit(1);
    });
}

export { seedDatabase };
