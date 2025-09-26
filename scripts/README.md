# 🌱 Database Seeding Scripts

This directory contains scripts to populate the Book Management Portal database with sample data for development and testing purposes.

## 📁 Files

- `seed-database.ts` - Main TypeScript seeding script
- `seed.sh` - Shell script wrapper for easy execution
- `README.md` - This documentation file

## 🚀 Quick Start

### Option 1: Using the Shell Script (Recommended)

```bash
# Make the script executable (if not already)
chmod +x scripts/seed.sh

# Run the seeding script
./scripts/seed.sh
```

### Option 2: Using npm Scripts

```bash
# Development mode (using ts-node)
npm run seed

# Production mode (using compiled JavaScript)
npm run seed:dev
```

### Option 3: Direct TypeScript Execution

```bash
# Using ts-node directly
npx ts-node -r tsconfig-paths/register scripts/seed-database.ts
```

## 📊 Sample Data Overview

The seeding script creates the following sample data:

### 👥 Users (7 users)
- **1 Admin User**: `admin@bookportal.com` (Password: `admin123`)
- **5 Regular Users**: Various test users with different names
- **1 Suspended User**: `suspended@example.com` (Account inactive)

### 📚 Books (12 books)
- **Classic Literature**: The Great Gatsby, To Kill a Mockingbird, 1984, Pride and Prejudice
- **Fantasy**: The Hobbit, Harry Potter, The Chronicles of Narnia
- **Modern Fiction**: The Alchemist, The Da Vinci Code, The Kite Runner
- **Other Genres**: The Catcher in the Rye, Lord of the Flies

### 💬 Feedback (25+ reviews)
- **Diverse Ratings**: 1-5 star ratings across different books
- **Realistic Comments**: Detailed, varied feedback comments
- **Status Variety**: Mix of visible and hidden feedback
- **User Distribution**: Multiple users reviewing different books

## 🔧 Prerequisites

Before running the seeding script, ensure you have:

1. **Database Setup**: PostgreSQL database running and accessible
2. **Environment Configuration**: `.env` file with database credentials
3. **Dependencies Installed**: Run `npm install` if not already done
4. **Database Created**: The target database should exist

### Required Environment Variables

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_DATABASE=book_management
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=development
PORT=3001
```

## 📋 What the Script Does

1. **Clears Existing Data**: Removes all existing users, books, and feedback
2. **Creates Users**: Seeds 7 users with hashed passwords
3. **Creates Books**: Adds 12 books with proper relationships
4. **Creates Feedback**: Generates 25+ realistic feedback entries
5. **Establishes Relationships**: Links books to creators and feedback to users/books
6. **Provides Summary**: Shows counts and test credentials

## 🎯 Test Scenarios

The seeded data supports testing of:

### Authentication Features
- ✅ User registration and login
- ✅ Role-based access control (Admin vs User)
- ✅ Account suspension handling
- ✅ Profile management

### Book Management
- ✅ Book CRUD operations
- ✅ Book ownership tracking
- ✅ ISBN validation
- ✅ Pagination and filtering
- ✅ Admin book management

### Feedback System
- ✅ Feedback creation with rate limiting
- ✅ Rating and comment validation
- ✅ Feedback moderation (hide/show)
- ✅ User-specific feedback views
- ✅ Book-specific feedback views

### API Testing
- ✅ All endpoints with realistic data
- ✅ Error handling scenarios
- ✅ Pagination testing
- ✅ Filtering and search

## 🔍 Sample Data Details

### User Roles Distribution
- **Admin**: 1 user (can manage all data)
- **Regular Users**: 5 users (can manage own data)
- **Suspended**: 1 user (tests account suspension)

### Book Categories
- **Classic Literature**: 4 books
- **Fantasy**: 3 books
- **Modern Fiction**: 3 books
- **Other Genres**: 2 books

### Feedback Distribution
- **5-star ratings**: 8 feedbacks
- **4-star ratings**: 10 feedbacks
- **3-star ratings**: 4 feedbacks
- **2-star ratings**: 2 feedbacks
- **1-star ratings**: 1 feedback
- **Hidden feedback**: 1 feedback (for moderation testing)

## ⚠️ Important Notes

### Development Only
- This script is designed for development and testing
- **DO NOT** run in production without modification
- Always backup production data before running

### Data Relationships
- Books are linked to users who created them
- Feedback is linked to both users and books
- Deleting a user cascades to their feedback
- Deleting a book cascades to its feedback

### Password Security
- All passwords are hashed using bcryptjs
- Default password for all test users: `password123`
- Admin password: `admin123`

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   ```
   Error: connect ECONNREFUSED 127.0.0.1:5432
   ```
   - Check if PostgreSQL is running
   - Verify database credentials in `.env`
   - Ensure database exists

2. **Permission Denied**
   ```
   Error: EACCES: permission denied
   ```
   - Make the shell script executable: `chmod +x scripts/seed.sh`
   - Check file permissions

3. **Module Not Found**
   ```
   Error: Cannot find module '@nestjs/...'
   ```
   - Run `npm install` to install dependencies
   - Check if all required packages are installed

4. **TypeScript Compilation Error**
   ```
   Error: Type 'string' is not assignable to type 'number'
   ```
   - Check TypeScript configuration
   - Ensure all entity relationships are correct

### Debug Mode

Run with debug logging:
```bash
DEBUG=* npm run seed
```

## 🔄 Resetting Data

To reset the database with fresh data:

```bash
# Clear and reseed
./scripts/seed.sh

# Or manually clear tables (PostgreSQL)
psql -d book_management -c "TRUNCATE TABLE feedbacks, books, users RESTART IDENTITY CASCADE;"
```

## 📈 Extending the Script

To add more sample data:

1. **Add Users**: Update the `users` array in `seedData`
2. **Add Books**: Update the `books` array in `seedData`
3. **Add Feedback**: Update the `feedbacks` array in `seedData`
4. **Maintain Relationships**: Ensure `createdBy`, `userId`, and `bookId` references are correct

## 🤝 Contributing

When adding new sample data:

- Use realistic, diverse data
- Maintain proper relationships
- Include edge cases for testing
- Update this documentation
- Test the seeding script thoroughly

---

**Happy Testing! 🎉**
