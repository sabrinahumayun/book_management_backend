# 📚 Book Management Portal - Backend API

A comprehensive NestJS-based backend API for managing books, user authentication, and feedback systems.

[![NestJS](https://img.shields.io/badge/NestJS-10.0.0-red.svg)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.1.3-blue.svg)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-8.16.3-blue.svg)](https://www.postgresql.org/)
[![JWT](https://img.shields.io/badge/JWT-Authentication-green.svg)](https://jwt.io/)
[![Swagger](https://img.shields.io/badge/Swagger-API%20Docs-green.svg)](https://swagger.io/)

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18 or higher)
- **PostgreSQL** (v12 or higher)
- **npm** or **yarn**

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd book_management_backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   ```
   
   Configure your `.env` file:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=your_username
   DB_PASSWORD=your_password
   DB_DATABASE=book_management
   
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key
   
   # Application Configuration
   NODE_ENV=development
   PORT=3001
   ```

4. **Database setup**
   ```bash
   # Create PostgreSQL database
   createdb book_management
   
   # The application will automatically create tables on first run
   # (synchronize: true in development mode)
   ```

5. **Start the application**
   ```bash
   # Development mode
   npm run start:dev
   
   # Production mode
   npm run build
   npm run start:prod
   ```

6. **Access the application**
   - **API Base URL**: `http://localhost:3001/api`
   - **Swagger Documentation**: `http://localhost:3001/api/docs`

## 🌱 Database Seeding

### Seed the Database with Test Data

The application includes comprehensive test data for development and testing:

```bash
# Quick seeding
npm run seed

# Using shell script (with confirmation)
./scripts/seed.sh

# Direct TypeScript execution
npx ts-node -r tsconfig-paths/register scripts/seed-database.ts
```

### What Gets Seeded

- **19 Users**: 2 Admins, 14 Regular Users, 2 Suspended Users
- **40+ Books**: Classic literature, fantasy, sci-fi, modern fiction, mystery, romance, biography, self-help, children's books, philosophy
- **50+ Feedback**: Diverse ratings (1-5 stars) with realistic comments

### Sample Data

#### Admin Users
- `admin@bookportal.com` / `admin123`
- `superadmin@bookportal.com` / `admin123`

#### Regular Users
- `john.doe@example.com` / `password123`
- `jane.smith@example.com` / `password123`
- And 12 more users...

#### Suspended Users
- `suspended@example.com` / `password123`
- `banned.user@example.com` / `password123`

### Data Relationships

- **User-Book Relationships**: Books are linked to their creators
- **User-Feedback Relationships**: Feedback is linked to reviewers  
- **Book-Feedback Relationships**: Feedback is linked to specific books
- **Cascade Operations**: Deleting users/books removes related feedback
- **Foreign Key Integrity**: All relationships maintain referential integrity

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run tests with coverage
npm run test:cov

# Run tests in watch mode
npm run test:watch
```

### Test Structure

- **Unit Tests**: Test individual services and controllers in isolation
- **Integration Tests**: Test complete API endpoints with database interactions
- **Test Coverage**: Comprehensive coverage reporting for all modules

## 📚 API Documentation

### Swagger Integration

The API includes comprehensive Swagger documentation accessible at `/api/docs`:

- **Interactive API explorer**
- **Request/Response examples**
- **Authentication testing**
- **Schema definitions**
- **Error response documentation**

### Key Endpoints

#### Authentication (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - User login
- `GET /profile` - Get user profile
- `PUT /profile` - Update user profile
- `GET /users` - Get all users (Admin only)
- `POST /users` - Create user (Admin only)
- `PATCH /users/:id` - Update user (Admin only)
- `DELETE /users/:id` - Delete user (Admin only)

#### Books (`/api/books`)
- `POST /` - Create book
- `GET /` - Get all books (paginated)
- `GET /my-books` - Get user's books
- `GET /:id` - Get book by ID
- `PATCH /:id` - Update book
- `DELETE /:id` - Delete book

#### Feedback (`/api/feedback`)
- `POST /` - Create feedback (rate limited: 1/min)
- `GET /all-reviews` - Get all visible reviews
- `GET /my-reviews` - Get user's reviews
- `GET /book/:bookId` - Get book feedback
- `PATCH /:id` - Update feedback
- `DELETE /:id` - Delete feedback

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DB_HOST` | Database host | localhost | ✅ |
| `DB_PORT` | Database port | 5432 | ✅ |
| `DB_USERNAME` | Database username | root | ✅ |
| `DB_PASSWORD` | Database password | - | ✅ |
| `DB_DATABASE` | Database name | book_management | ✅ |
| `JWT_SECRET` | JWT signing secret | - | ✅ |
| `NODE_ENV` | Environment | development | ❌ |
| `PORT` | Application port | 3001 | ❌ |

## 🐳 Docker Support

### Development with Docker

```bash
# Start development environment
npm run docker:up

# View logs
npm run docker:logs

# Stop environment
npm run docker:down
```

### Production with Docker

```bash
# Start production environment
npm run docker:prod

# Stop production environment
npm run docker:prod:down
```

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:

- **Documentation**: Check the Swagger docs at `/api/docs`
- **Issues**: Create an issue in the repository

---

